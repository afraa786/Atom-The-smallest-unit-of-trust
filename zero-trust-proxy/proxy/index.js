require("dotenv").config();
const express = require("express");
const { issueToken } = require("../auth/issue-token");
const { hasIdentity } = require("../auth/identity-registry");
const { verifyMiddleware } = require("./verify-middleware");
const { rbacMiddleware } = require("./rbac-middleware");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = "zero-trust-proxy";

// Where the proxy forwards verified requests to. Uses docker-compose service
// DNS names when running in a container network, falls back to localhost.
const SERVICE_HOSTS = {
  "user-service": process.env.USER_SERVICE_URL || "http://localhost:5001",
  "payment-service": process.env.PAYMENT_SERVICE_URL || "http://localhost:5002",
  "db-service": process.env.DB_SERVICE_URL || "http://localhost:5003",
};

app.get("/health", (req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

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

// Every inter-service call flows through this checkpoint in two stages:
// 1. verifyMiddleware proves WHO is calling (cryptographic identity).
// 2. rbacMiddleware decides IF that already-proven caller is allowed to
//    reach the requested target (static policy). Both must pass.
app.all("/route/:targetService/*", verifyMiddleware, rbacMiddleware, async (req, res) => {
  const { targetService } = req.params;
  const targetPath = "/" + req.params[0];

  const baseUrl = SERVICE_HOSTS[targetService];
  if (!baseUrl) {
    console.warn(`[${SERVICE_NAME}] rejected: unknown target service '${targetService}'`);
    return res.status(400).json({ error: `unknown target service '${targetService}'` });
  }

  const url = `${baseUrl}${targetPath}`;
  console.log(`[${SERVICE_NAME}] forwarding to ${targetService} -> ${req.method} ${url}`);

  try {
    const response = await fetch(url, { method: req.method });
    const data = await response.json();
    console.log(`[${SERVICE_NAME}] response relayed from ${targetService} (status ${response.status})`);
    res.status(response.status).json(data);
  } catch (err) {
    console.error(`[${SERVICE_NAME}] forwarding to ${targetService} failed: ${err.message}`);
    res.status(502).json({ error: `failed to reach ${targetService}`, details: err.message });
  }
});

app.listen(PORT, () => console.log(`${SERVICE_NAME} listening on ${PORT}`));
