// Issues short-lived JWTs, one per requesting service, each signed with
// that service's own secret from the identity registry (not a shared
// global secret).

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getSecret, hasIdentity } = require("./identity-registry");

const TOKEN_TTL_SECONDS = 60;

function issueToken(serviceName) {
  if (!hasIdentity(serviceName)) {
    throw new Error(`cannot issue token: unknown service '${serviceName}'`);
  }

  const secret = getSecret(serviceName);

  const payload = {
    service: serviceName,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString("hex"),
  };

  return jwt.sign(payload, secret, { expiresIn: TOKEN_TTL_SECONDS });
}

module.exports = { issueToken, TOKEN_TTL_SECONDS };
