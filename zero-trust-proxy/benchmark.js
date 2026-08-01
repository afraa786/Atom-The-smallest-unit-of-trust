// Standalone benchmark: fires 100 rapid sequential requests along the
// normal allowed path (user-service -> payment-service, through the
// proxy's full checkpoint chain) and reports the proxy-only overhead
// latency distribution, sourced from GET /logs after the run.
//
// Run with: node benchmark.js
// Requires the proxy (port 4000) to already be running.

const PROXY_URL = process.env.PROXY_URL || "http://localhost:4000";
const REQUEST_COUNT = 100;
const TARGET_MS = 15;

async function fetchToken() {
  const res = await fetch(`${PROXY_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: "user-service" }),
  });
  if (!res.ok) throw new Error(`token request failed: ${res.status}`);
  const { token } = await res.json();
  return token;
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[index];
}

async function main() {
  console.log(`Benchmarking ${REQUEST_COUNT} sequential requests: user-service -> payment-service via proxy...`);

  let token = await fetchToken();
  let tokenIssuedAt = Date.now();

  for (let i = 0; i < REQUEST_COUNT; i++) {
    // Tokens are short-lived (60s) — refresh if we're running long.
    if (Date.now() - tokenIssuedAt > 50_000) {
      token = await fetchToken();
      tokenIssuedAt = Date.now();
    }

    const res = await fetch(`${PROXY_URL}/route/payment-service/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await res.json();

    if (!res.ok) {
      console.warn(`  request ${i + 1} returned unexpected status ${res.status}`);
    }
  }

  console.log("Requests complete. Reading proxy-measured latency from GET /logs...");

  const logsRes = await fetch(
    `${PROXY_URL}/logs?service=user-service&decision=allowed`
  );
  const { logs } = await logsRes.json();

  // Only this run's entries — take the most recent REQUEST_COUNT.
  const sample = logs.slice(0, REQUEST_COUNT).map((e) => e.latencyMs);

  if (sample.length === 0) {
    console.error("No log entries found — cannot compute benchmark results.");
    process.exit(1);
  }

  const sorted = [...sample].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = percentile(sorted, 0.95);

  console.log("");
  console.log("=== Benchmark results (proxy checkpoint overhead only) ===");
  console.log(`Sample size: ${sorted.length}`);
  console.log(`Min:     ${min.toFixed(3)}ms`);
  console.log(`Average: ${avg.toFixed(3)}ms`);
  console.log(`Max:     ${max.toFixed(3)}ms`);
  console.log(`P95:     ${p95.toFixed(3)}ms`);
  console.log("");

  const pass = avg <= TARGET_MS;
  console.log(
    `Average overhead: ${avg.toFixed(2)}ms — ${pass ? "PASS" : "FAIL"} (target: <=${TARGET_MS}ms)`
  );

  if (!pass) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
