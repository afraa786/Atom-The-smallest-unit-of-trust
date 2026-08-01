// Third checkpoint, run AFTER identity (verify-middleware) and RBAC
// (rbac-middleware) have both already passed. Evaluates properties of the
// request itself — time window, claimed region, payload size — rather
// than who is making it.
//
// Unlike identity/RBAC failures (hard 401/403), a context-check failure
// does NOT hard-reject on the first attempt. Instead it responds with
// 428 Precondition Required and { reauth_required: true }, signaling the
// caller to fetch a fresh token and retry once. The proxy itself is
// stateless per-request — it has no memory of "this is a retry" — so the
// one-retry-then-hard-fail behavior is enforced by the CALLING SERVICE
// (see each service's fetchWithReauth logic), not by the proxy tracking
// attempt counts.

const { checkTimeWindow, checkGeo, checkPayloadSize } = require("../policy/context-policy");

const PROXY_NAME = "zero-trust-proxy";

function contextMiddleware(req, res, next) {
  const region = req.headers["x-simulated-region"] || "US";
  // Measured from the actual parsed body, not a client-supplied
  // Content-Length header — a caller could lie about that header, so it
  // is not trusted as the source of truth for payload size.
  const bodyBytes = Buffer.byteLength(JSON.stringify(req.body || {}));

  const timeResult = checkTimeWindow();
  const geoResult = checkGeo(region);
  const payloadResult = checkPayloadSize(bodyBytes);

  console.log(
    `[${PROXY_NAME}] context check: time=${timeResult.pass ? "PASS" : "FAIL"}, ` +
      `geo=${geoResult.pass ? "PASS" : "FAIL"}, payload=${payloadResult.pass ? "PASS" : "FAIL"}`
  );

  const failures = [timeResult, geoResult, payloadResult].filter((r) => !r.pass);

  if (failures.length > 0) {
    const reason = failures.map((f) => f.reason).join("; ");
    console.warn(`[${PROXY_NAME}] context check failed, requiring re-authentication: ${reason}`);
    return res.status(428).json({ reauth_required: true, reason });
  }

  next();
}

module.exports = { contextMiddleware };
