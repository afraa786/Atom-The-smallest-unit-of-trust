// Unified, structured request log — one entry per request that reaches
// the proxy's /route/:targetService/* checkpoint, covering the FINAL
// outcome regardless of which middleware in the chain decided it (or let
// it through to the target). This consolidates what was previously just
// scattered console.log lines plus the separate Step 9 /alerts list into
// a single queryable record per request.
//
// In-memory array, newest last internally; trimmed to the last 500
// entries so it can't grow unbounded over a long-running process.
//
// latencyMs is real proxy-checkpoint-only overhead as of Step 11 —
// measured from the first line of verify-middleware to the point the
// final decision (allow or reject) is made, excluding the downstream
// network call to the actual target service.

const MAX_ENTRIES = 500;

const entries = [];

function addEntry(entry) {
  entries.push({
    timestamp: new Date().toISOString(),
    caller: "unknown",
    target: null,
    decision: "allowed",
    reason: null,
    securityAlert: null,
    latencyMs: 0,
    ...entry,
  });

  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

function getEntries({ service, decision } = {}) {
  let result = entries;

  if (service) {
    result = result.filter((e) => e.caller === service);
  }
  if (decision) {
    result = result.filter((e) => e.decision === decision);
  }

  // Most recent first.
  return [...result].reverse();
}

// Aggregate latency stats over the last N entries (default 100, matching
// what GET /logs exposes by default). Percentile uses nearest-rank on the
// sorted sample — simple and adequate for this sample size.
function getLatencyMetrics(sampleCount = 100) {
  const sample = getEntries().slice(0, sampleCount).map((e) => e.latencyMs);

  if (sample.length === 0) {
    return { avgMs: 0, maxMs: 0, minMs: 0, p95Ms: 0, sampleSize: 0 };
  }

  const sorted = [...sample].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const p95Index = Math.min(
    sorted.length - 1,
    Math.ceil(0.95 * sorted.length) - 1
  );

  return {
    avgMs: sum / sorted.length,
    maxMs: sorted[sorted.length - 1],
    minMs: sorted[0],
    p95Ms: sorted[p95Index],
    sampleSize: sorted.length,
  };
}

module.exports = { addEntry, getEntries, getLatencyMetrics, MAX_ENTRIES };
