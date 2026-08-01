// Context-aware policy checks, evaluated AFTER identity (verify-middleware)
// and RBAC (rbac-middleware) have both already passed. These look at
// properties of the request itself — when it happened, where it claims
// to originate, how big it is — rather than who is making it.
//
// Each check is independent and returns { pass: boolean, reason?: string }.
// A failing check does not by itself decide what the proxy does with the
// request (that's context-middleware's job) — it just reports the
// specific reason so the caller can be told exactly what to fix.

const { loadMeshConfig } = require("../config/load-mesh-config");

const ALLOWED_REGIONS = loadMeshConfig().allowedRegions;
const MAX_PAYLOAD_BYTES = Number(process.env.MAX_PAYLOAD_BYTES) || 10 * 1024; // 10KB default

function checkTimeWindow(now = new Date()) {
  const start = Number(process.env.ALLOWED_HOURS_START ?? 0);
  const end = Number(process.env.ALLOWED_HOURS_END ?? 24);
  const hour = now.getHours();

  // Supports a simple same-day window (start <= hour < end). Does not
  // handle overnight-wrapping windows (e.g. 22 -> 6) — out of scope for
  // this demo-configurable check.
  const withinWindow = hour >= start && hour < end;

  if (!withinWindow) {
    return {
      pass: false,
      reason: `request outside allowed time window (allowed ${start}:00-${end}:00, current hour ${hour})`,
    };
  }
  return { pass: true };
}

function checkGeo(region) {
  const effectiveRegion = region || "US";

  if (!ALLOWED_REGIONS.includes(effectiveRegion)) {
    return {
      pass: false,
      reason: `request originates from disallowed region '${effectiveRegion}' (allowed: ${ALLOWED_REGIONS.join(", ")})`,
    };
  }
  return { pass: true };
}

function checkPayloadSize(byteLength) {
  if (byteLength > MAX_PAYLOAD_BYTES) {
    return {
      pass: false,
      reason: `request payload of ${byteLength} bytes exceeds limit of ${MAX_PAYLOAD_BYTES} bytes`,
    };
  }
  return { pass: true };
}

module.exports = { checkTimeWindow, checkGeo, checkPayloadSize, ALLOWED_REGIONS, MAX_PAYLOAD_BYTES };
