// Enforcement checkpoint for every /route/:targetService/* request.
// Extracts + verifies the caller's Bearer token before any request is
// allowed to reach a downstream service. No token, or a token that
// fails verification (missing, expired, tampered, wrong signature),
// means the request is rejected here — it never gets forwarded.

const { verifyToken } = require("../auth/verify-token");

const PROXY_NAME = "zero-trust-proxy";

function verifyMiddleware(req, res, next) {
  console.log(`[${PROXY_NAME}] received request: ${req.method} ${req.originalUrl}`);

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`[${PROXY_NAME}] rejected 401: missing or malformed Authorization header`);
    return res.status(401).json({ error: "missing or malformed Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  console.log(`[${PROXY_NAME}] verifying token`);
  const verified = verifyToken(token);

  if (!verified) {
    console.warn(`[${PROXY_NAME}] rejected 401: invalid, expired, or tampered token`);
    return res.status(401).json({ error: "invalid, expired, or tampered token" });
  }

  console.log(`[${PROXY_NAME}] verified as '${verified.service}'`);

  // Attach the verified caller identity to the request for downstream use.
  req.callerIdentity = verified;

  next();
}

module.exports = { verifyMiddleware };
