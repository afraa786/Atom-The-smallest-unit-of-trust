// Enforcement checkpoint for every /route/:targetService/* request.
// Extracts + verifies the caller's Bearer token before any request is
// allowed to reach a downstream service. No token, or a token that
// fails verification (missing, expired, tampered, wrong signature),
// means the request is rejected here — it never gets forwarded.

const { verifyToken } = require("../auth/verify-token");
const { addEntry } = require("../logs/request-log");
const { now, elapsedMs } = require("../logs/timing.js");

const PROXY_NAME = "zero-trust-proxy";

function verifyMiddleware(req, res, next) {
  // Very first line of the very first middleware in the chain — this is
  // the start boundary for proxy-only checkpoint overhead. Everything
  // measured against this excludes the downstream fetch() to the actual
  // target service, which only happens after all checkpoints pass.
  req._startTime = now();

  console.log(`[${PROXY_NAME}] received request: ${req.method} ${req.originalUrl}`);

  const target = req.params.targetService;
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[${PROXY_NAME}] rejected 401: missing or malformed Authorization header`);
    addEntry({
      caller: "unknown",
      target,
      decision: "blocked_identity",
      reason: "missing or malformed Authorization header",
      latencyMs: elapsedMs(req._startTime),
    });
    return res.status(401).json({ error: "missing or malformed Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  console.log(`[${PROXY_NAME}] verifying token`);
  const verified = verifyToken(token);

  if (!verified) {
    console.warn(`[${PROXY_NAME}] rejected 401: invalid, expired, or tampered token`);
    addEntry({
      caller: "unknown",
      target,
      decision: "blocked_identity",
      reason: "invalid, expired, or tampered token",
      latencyMs: elapsedMs(req._startTime),
    });
    return res.status(401).json({ error: "invalid, expired, or tampered token" });
  }

  console.log(`[${PROXY_NAME}] verified as '${verified.service}'`);

  // Attach the verified caller identity to the request for downstream use.
  req.callerIdentity = verified;

  // Seed the accumulator every subsequent middleware (and the final
  // route handler) will refine as the request proceeds through the
  // chain. Exactly one addEntry() call ultimately fires for this
  // request — either from whichever middleware rejects it, or from the
  // final handler on success.
  req.logEntry = {
    caller: verified.service,
    target,
    decision: "allowed",
    reason: null,
    securityAlert: null,
  };

  next();
}

module.exports = { verifyMiddleware };
