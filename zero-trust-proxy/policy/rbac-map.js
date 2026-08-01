// Static "who can call whom" policy, loaded from mesh.config.json's
// "rbac" section. Each key is a caller service; its value is the list of
// target services that caller is permitted to reach through the proxy.
// Anything not listed is implicitly denied.
//
// This is a static allow-list, checked after identity has already been
// cryptographically verified — context-awareness (time/geo/payload) is a
// separate, later checkpoint (policy/context-policy.js).

const { loadMeshConfig } = require("../config/load-mesh-config");

const RBAC_MAP = loadMeshConfig().rbac;

function isAllowed(callerService, targetService) {
  const allowedTargets = RBAC_MAP[callerService];
  if (!allowedTargets) return false;
  return allowedTargets.includes(targetService);
}

module.exports = { RBAC_MAP, isAllowed };
