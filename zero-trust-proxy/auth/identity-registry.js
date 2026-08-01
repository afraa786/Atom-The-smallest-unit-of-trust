// In-memory registry mapping service name -> its cryptographic secret.
// Secrets are never hardcoded here — they're read from environment
// variables at load time. Used by the proxy (and later, JWT
// issuing/verification in Step 4) to look up which secret belongs to
// which service identity.

require("dotenv").config();

const REGISTRY = {
  "user-service": process.env.USER_SERVICE_SECRET,
  "payment-service": process.env.PAYMENT_SERVICE_SECRET,
  "db-service": process.env.DB_SERVICE_SECRET,
};

function getSecret(serviceName) {
  const secret = REGISTRY[serviceName];
  if (!secret) {
    throw new Error(`no identity secret registered for service '${serviceName}'`);
  }
  return secret;
}

function hasIdentity(serviceName) {
  return Boolean(REGISTRY[serviceName]);
}

function listServices() {
  return Object.keys(REGISTRY);
}

module.exports = { getSecret, hasIdentity, listServices };
