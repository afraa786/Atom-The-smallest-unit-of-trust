require("dotenv").config();
const express = require("express");
const { issueToken } = require("../auth/issue-token");
const { hasIdentity } = require("../auth/identity-registry");
const { verifyMiddleware } = require("./verify-middleware");
const { rbacMiddleware } = require("./rbac-middleware");
const { contextMiddleware } = require("./context-middleware");
const { rateLimitMiddleware } = require("./rate-limit-middleware");
const { lateralMovementMiddleware, getAlerts } = require("./lateral-movement-middleware");
const { addEntry, getEntries, getLatencyMetrics } = require("../logs/request-log");
const { elapsedMs } = require("../logs/timing.js");
const { RBAC_MAP } = require("../policy/rbac-map");
const { loadMeshConfig } = require("../config/load-mesh-config");

const app = express();
app.use(express.json());

// Allows the frontend dashboard (running on a different origin/port) to
// call these read-only observability endpoints directly from the browser.
// Only applied broadly since /metrics, /logs, /alerts are non-sensitive,
// read-only, and this is a local demo mesh — not a blanket policy for
// every route.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Simulated-Region");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = "zero-trust-proxy";

// Where the proxy forwards verified requests to, loaded from
// mesh.config.json. Each service's "urlEnv" (e.g. USER_SERVICE_URL) lets
// docker-compose or k8s override the default URL with a DNS name when
// running in a container network; falls back to the config's "url".
const SERVICE_HOSTS = loadMeshConfig().hosts;

app.get("/health", (req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

app.get("/alerts", (req, res) => {
  res.json({ alerts: getAlerts() });
});

app.get("/logs", (req, res) => {
  const { service, decision } = req.query;
  const entries = getEntries({ service, decision }).slice(0, 100);
  res.json({ logs: entries });
});

app.get("/metrics", (req, res) => {
  res.json(getLatencyMetrics(100));
});

app.get("/policy/rbac", (req, res) => {
  res.json(RBAC_MAP);
});

app.post("/auth/token", (req, res) => {
  const { service } = req.body || {};

  if (!service || !hasIdentity(service)) {
    console.warn(`[${SERVICE_NAME}] token request rejected: unknown service '${service}'`);
    return res.status(401).json({ error: `unknown or unregistered service '${service}'` });
  }

  const token = issueToken(service);
  console.log(`[${SERVICE_NAME}] issued token for '${service}'`);
  res.json({ token });
});

// Every inter-service call flows through this checkpoint in five stages:
// 1. verifyMiddleware proves WHO is calling (cryptographic identity).
// 2. rbacMiddleware decides IF that already-proven caller is allowed to
//    reach the requested target (static policy).
// 3. lateralMovementMiddleware watches the BEHAVIOR of RBAC-permitted
//    calls for suspicious patterns (novel targets, rapid fan-out) — it
//    never blocks, only alerts, since RBAC already governs permission.
// 4. contextMiddleware evaluates the request itself (time/geo/payload) —
//    a failure here doesn't hard-block, it asks the caller to re-auth
//    and retry once (428), only hard-failing if the caller gives up.
// 5. rateLimitMiddleware caps how often even a fully legitimate, in-policy
//    caller may hit the mesh — a hard 429 stop, no retry offered.
app.all(
  "/route/:targetService/*",
  verifyMiddleware,
  rbacMiddleware,
  lateralMovementMiddleware,
  contextMiddleware,
  rateLimitMiddleware,
  async (req, res) => {
    const { targetService } = req.params;
    const targetPath = "/" + req.params[0];
    const caller = req.callerIdentity && req.callerIdentity.service;
    const securityAlert = req.logEntry ? req.logEntry.securityAlert : null;

    // Captured HERE — the instant all five checkpoints (identity, RBAC,
    // lateral-movement, context, rate-limit) have passed. This is the
    // proxy-only overhead measurement. Everything after this line is
    // either a routing lookup or the downstream network call to the
    // target service, neither of which counts as checkpoint overhead —
    // so the captured number is reused below regardless of how long the
    // subsequent fetch() takes, rather than recomputed after it returns.
    const checkpointLatencyMs = elapsedMs(req._startTime);

    const baseUrl = SERVICE_HOSTS[targetService];
    if (!baseUrl) {
      console.warn(`[${SERVICE_NAME}] rejected: unknown target service '${targetService}'`);
      // Passed every security checkpoint (identity/RBAC/context/rate-limit) —
      // this is a routing error, not a security decision, so it's still
      // logged as "allowed" with the reason explaining what went wrong.
      addEntry({
        caller,
        target: targetService,
        decision: "allowed",
        reason: `allowed, but target service '${targetService}' is not registered (400) — not routed`,
        securityAlert,
        latencyMs: checkpointLatencyMs,
      });
      return res.status(400).json({ error: `unknown target service '${targetService}'` });
    }

    const url = `${baseUrl}${targetPath}`;
    console.log(`[${SERVICE_NAME}] forwarding to ${targetService} -> ${req.method} ${url}`);

    try {
      const response = await fetch(url, { method: req.method });
      const data = await response.json();
      console.log(`[${SERVICE_NAME}] response relayed from ${targetService} (status ${response.status})`);
      addEntry({
        caller,
        target: targetService,
        decision: "allowed",
        reason: null,
        securityAlert,
        latencyMs: checkpointLatencyMs,
      });
      res.status(response.status).json(data);
    } catch (err) {
      console.error(`[${SERVICE_NAME}] forwarding to ${targetService} failed: ${err.message}`);
      addEntry({
        caller,
        target: targetService,
        decision: "allowed",
        reason: `allowed, but target unreachable (502): ${err.message}`,
        securityAlert,
        latencyMs: checkpointLatencyMs,
      });
      res.status(502).json({ error: `failed to reach ${targetService}`, details: err.message });
    }
  }
);

app.listen(PORT, () => console.log(`${SERVICE_NAME} listening on ${PORT}`));
