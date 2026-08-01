// Fifth middleware. Runs after rbac-middleware — by the time a request
// reaches here, RBAC has already decided the caller is PERMITTED to
// reach this target. This checkpoint isn't about permission; it's about
// behavior. A permitted call can still be part of a suspicious pattern
// (a compromised-but-authorized service probing sideways), so this does
// not hard-block the request — it flags it, logs it prominently, and
// lets the request proceed. RBAC/identity/context/rate-limit remain the
// actual gatekeepers; this is an observability + alerting layer on top.

const { checkLateralMovement } = require("../policy/lateral-movement-detector");

const PROXY_NAME = "zero-trust-proxy";

// In-memory alert log, newest last. Exposed via GET /alerts.
const alerts = [];

function lateralMovementMiddleware(req, res, next) {
  const caller = req.callerIdentity && req.callerIdentity.service;
  const target = req.params.targetService;

  if (!caller) {
    // Should never happen if verifyMiddleware ran first — but this
    // checkpoint never blocks, so just skip detection and proceed.
    return next();
  }

  const result = checkLateralMovement(caller, target);

  if (result.suspicious) {
    const alert = {
      timestamp: new Date().toISOString(),
      caller,
      target,
      signal: result.signal,
      details: result.details,
    };
    alerts.push(alert);

    console.warn(
      `[${PROXY_NAME}] SECURITY ALERT: lateral movement signal '${result.signal}' — ${result.details}`
    );

    res.setHeader("X-Security-Alert", result.signal);
  }

  next();
}

function getAlerts() {
  return alerts;
}

module.exports = { lateralMovementMiddleware, getAlerts };
