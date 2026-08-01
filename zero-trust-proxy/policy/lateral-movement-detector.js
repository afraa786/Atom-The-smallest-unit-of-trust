// Detects the behavioral signature of a compromised service pivoting
// sideways through the mesh — patterns that are invisible to identity,
// RBAC, context, and rate-limit checks individually, because any single
// request in the pattern can look perfectly legitimate on its own. This
// only runs on calls RBAC has already allowed (a call RBAC blocks is
// already handled there — this is about abuse of PERMITTED access).
//
// Tracks, per calling service, a rolling history of (targetService,
// timestamp) pairs. Two independent signals:
//
//   novel_target  — the caller has never called this target before,
//                   anywhere in its tracked history. A service that has
//                   only ever talked to one target suddenly reaching for
//                   a new one is worth flagging, even if RBAC permits it.
//
//   rapid_fanout  — the caller has hit 3+ DISTINCT targets within a short
//                   window (default 5s). This is the classic lateral-
//                   movement probe pattern: an attacker with a stolen
//                   token rapidly testing what else it can reach.

const FANOUT_WINDOW_MS = Number(process.env.LATERAL_FANOUT_WINDOW_MS) || 5000;
const FANOUT_THRESHOLD = Number(process.env.LATERAL_FANOUT_THRESHOLD) || 3;
const HISTORY_RETENTION_MS = Number(process.env.LATERAL_HISTORY_RETENTION_MS) || 15 * 60 * 1000; // 15 min

// serviceName -> array of { target, at } call records, newest last.
const callHistory = new Map();

function pruneOld(records, now) {
  return records.filter((r) => now - r.at <= HISTORY_RETENTION_MS);
}

function checkLateralMovement(callerService, targetService) {
  const now = Date.now();
  const records = pruneOld(callHistory.get(callerService) || [], now);

  const hasCalledBefore = records.some((r) => r.target === targetService);

  // Distinct targets hit within the fan-out window, INCLUDING this call.
  const withinWindow = records.filter((r) => now - r.at <= FANOUT_WINDOW_MS);
  const distinctRecentTargets = new Set(withinWindow.map((r) => r.target));
  distinctRecentTargets.add(targetService);

  // Record this call before returning, so subsequent calls see it.
  records.push({ target: targetService, at: now });
  callHistory.set(callerService, records);

  if (distinctRecentTargets.size >= FANOUT_THRESHOLD) {
    return {
      suspicious: true,
      signal: "rapid_fanout",
      details: `${callerService} contacted ${distinctRecentTargets.size} distinct targets (${[...distinctRecentTargets].join(", ")}) within ${FANOUT_WINDOW_MS}ms`,
    };
  }

  if (!hasCalledBefore) {
    return {
      suspicious: true,
      signal: "novel_target",
      details: `${callerService} called '${targetService}' for the first time in its tracked history`,
    };
  }

  return { suspicious: false, signal: null, details: null };
}

// Exposed for tests/inspection — not used by the middleware itself.
function getHistory(callerService) {
  return callHistory.get(callerService) || [];
}

module.exports = { checkLateralMovement, getHistory, FANOUT_WINDOW_MS, FANOUT_THRESHOLD };
