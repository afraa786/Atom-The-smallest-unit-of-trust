// In-memory registry mapping service name -> its cryptographic secret.
// Secrets are never hardcoded here — they're read from environment
// variables at load time, per the "secretEnv" pointer in mesh.config.json.
// Used by the proxy (and JWT issuing/verification) to look up which
// secret belongs to which service identity.

require("dotenv").config();
const { loadMeshConfig } = require("../config/load-mesh-config");

const REGISTRY = loadMeshConfig().secrets;

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
