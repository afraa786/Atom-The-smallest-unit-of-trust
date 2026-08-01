// Fourth and final checkpoint, run after verify -> rbac -> context all
// pass. Even a fully identified, authorized, in-policy caller can still
// be rate limited — this exists purely to prevent flooding/abuse, not to
// question who the caller is or whether they're allowed to be here.

const { checkRateLimit } = require("../policy/rate-limiter");

const PROXY_NAME = "zero-trust-proxy";

function rateLimitMiddleware(req, res, next) {
  const caller = req.callerIdentity && req.callerIdentity.service;

  if (!caller) {
    // Should never happen if verifyMiddleware ran first, but fail closed.
    console.warn(`[${PROXY_NAME}] rate limit check skipped: no verified caller identity on request`);
    return res.status(401).json({ error: "no verified caller identity" });
  }

  const result = checkRateLimit(caller);

  console.log(
    `[${PROXY_NAME}] rate limit check: ${caller} = ${result.count}/${result.max} requests in window: ` +
      (result.allowed ? "PASS" : "FAIL")
  );

  if (!result.allowed) {
    console.warn(
      `[${PROXY_NAME}] rate limit exceeded for '${caller}', retry after ${result.retryAfterMs}ms`
    );
    return res.status(429).json({
      error: "rate limit exceeded",
      retryAfterMs: result.retryAfterMs,
    });
  }

  next();
}

module.exports = { rateLimitMiddleware };
