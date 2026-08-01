// Static "who can call whom" policy. Each key is a caller service; its
// value is the list of target services that caller is permitted to reach
// through the proxy. Anything not listed is implicitly denied.
//
// No context-awareness (time/geo/payload) yet — that's Step 7. This is
// purely a static allow-list, checked after identity has already been
// cryptographically verified.

const RBAC_MAP = {
  "user-service": ["payment-service"],
  "payment-service": ["db-service", "notification-service"],
  "db-service": [],
  "notification-service": [],
};

function isAllowed(callerService, targetService) {
  const allowedTargets = RBAC_MAP[callerService];
  if (!allowedTargets) return false;
  return allowedTargets.includes(targetService);
}

module.exports = { RBAC_MAP, isAllowed };
