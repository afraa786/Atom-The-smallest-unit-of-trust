// Static RBAC checkpoint. Runs AFTER verify-middleware, so it can trust
// req.callerIdentity.service — the caller's identity is already
// cryptographically proven by this point. This middleware only decides
// whether that already-verified caller is POLICY-permitted to reach the
// requested target. A valid token is necessary but not sufficient.

const { isAllowed } = require("../policy/rbac-map");

const PROXY_NAME = "zero-trust-proxy";

function rbacMiddleware(req, res, next) {
  const caller = req.callerIdentity && req.callerIdentity.service;
  const target = req.params.targetService;

  if (!caller) {
    // Should never happen if verifyMiddleware ran first, but fail closed.
    console.warn(`[${PROXY_NAME}] RBAC check skipped: no verified caller identity on request`);
    return res.status(401).json({ error: "no verified caller identity" });
  }

  const allowed = isAllowed(caller, target);

  console.log(
    `[${PROXY_NAME}] RBAC check: ${caller} -> ${target}: ${allowed ? "ALLOWED" : "DENIED"}`
  );

  if (!allowed) {
    return res.status(403).json({
      error: `${caller} is not authorized to call ${target}`,
    });
  }

  next();
}

module.exports = { rbacMiddleware };
