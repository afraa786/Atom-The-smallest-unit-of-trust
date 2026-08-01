// High-resolution timing helper for measuring proxy-only checkpoint
// overhead — deliberately NOT wall-clock Date.now(), since that has
// millisecond resolution at best and can jump on system clock
// adjustments. process.hrtime.bigint() is monotonic and nanosecond-
// resolution, which matters here because the thing being measured
// (identity + RBAC + context + rate-limit + lateral-movement checks) is
// expected to complete in low single-digit milliseconds.

function now() {
  return process.hrtime.bigint();
}

function elapsedMs(startNs) {
  const endNs = process.hrtime.bigint();
  return Number(endNs - startNs) / 1_000_000;
}

module.exports = { now, elapsedMs };
