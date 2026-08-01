// Standalone attack simulation — exercises the live zero-trust-proxy
// mesh over plain HTTP, exactly as any real caller would. Does not
// import or touch zero-trust-proxy's code; it only speaks to the ports
// it exposes (proxy on 4000, services on 5001-5004).
//
// Run with: node simulate-attack.js
// Requires the full mesh (proxy + all 4 services) already running.

const PROXY_URL = process.env.PROXY_URL || "http://localhost:4000";

const distinctThreats = new Set();

// The proxy's /alerts and /logs are in-memory and persist across the
// proxy's whole lifetime, not per-script-run. Without a baseline, a
// second run against an already-warm proxy would report stale counts
// left over from a prior run as if they happened just now. Captured
// once, before Stage 1 fires a single request, and used to report only
// what THIS run actually produced.
let runStartedAt = null; // set in main(), before Stage 1 — epoch ms

function log(msg) {
  console.log(msg);
}

async function fetchToken(service) {
  const res = await fetch(`${PROXY_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service }),
  });
  if (!res.ok) {
    throw new Error(`token request for '${service}' failed: ${res.status}`);
  }
  const { token } = await res.json();
  return token;
}

async function callThroughProxy(callerService, targetService, extraHeaders = {}) {
  const token = await fetchToken(callerService);
  const res = await fetch(`${PROXY_URL}/route/${targetService}/data`, {
    headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body — leave null
  }
  return { status: res.status, body, headers: res.headers };
}

async function stage1() {
  log("Stage 1: Baseline traffic — establishing normal behavior...");

  const r1 = await callThroughProxy("user-service", "payment-service");
  log(`  user-service -> payment-service: HTTP ${r1.status}`);

  const r2 = await callThroughProxy("payment-service", "db-service");
  log(`  payment-service -> db-service: HTTP ${r2.status}`);

  const r3 = await callThroughProxy("user-service", "payment-service");
  log(`  user-service -> payment-service: HTTP ${r3.status}`);

  log("");
}

async function stage2() {
  log("Stage 2: Attempting unauthorized lateral access (user-service -> db-service)...");

  const result = await callThroughProxy("user-service", "db-service");

  if (result.status === 403) {
    log("  BLOCKED by RBAC");
    distinctThreats.add("unauthorized_lateral_access");
  } else {
    log(`  Unexpected result: HTTP ${result.status} (expected 403)`);
  }

  log("");
}

async function stage3() {
  log("Stage 3: Simulating rapid fan-out pattern...");

  // payment-service is RBAC-permitted to reach both db-service and
  // notification-service — hitting both back-to-back is a legitimate
  // path that still trips the behavioral rapid_fanout detector.
  const r1 = await callThroughProxy("payment-service", "db-service");
  log(`  payment-service -> db-service: HTTP ${r1.status}`);

  const r2 = await callThroughProxy("payment-service", "notification-service");
  log(`  payment-service -> notification-service: HTTP ${r2.status}`);

  const alertHeader = r2.headers.get("x-security-alert");
  if (alertHeader) {
    log(`  X-Security-Alert header on response: ${alertHeader}`);
  }

  const alertsRes = await fetch(`${PROXY_URL}/alerts`);
  const { alerts } = await alertsRes.json();
  const alertsThisRun = alerts.filter((a) => new Date(a.timestamp).getTime() >= runStartedAt);
  const fanoutAlert = [...alertsThisRun].reverse().find((a) => a.signal === "rapid_fanout");

  if (fanoutAlert) {
    log("  ALERT CONFIRMED via GET /alerts:");
    log(`    ${JSON.stringify(fanoutAlert)}`);
    distinctThreats.add("rapid_fanout");
  } else {
    log("  No rapid_fanout alert found in /alerts (unexpected)");
  }

  log("");
}

async function stage4() {
  log("Stage 4: Flooding proxy with rapid requests...");

  const REQUEST_COUNT = 25;
  let succeeded = 0;
  let rateLimited = 0;
  let other = 0;

  const token = await fetchToken("user-service");

  for (let i = 0; i < REQUEST_COUNT; i++) {
    const res = await fetch(`${PROXY_URL}/route/payment-service/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await res.json().catch(() => null);

    if (res.status === 200) succeeded++;
    else if (res.status === 429) rateLimited++;
    else other++;
  }

  log(`  Fired ${REQUEST_COUNT} rapid requests: user-service -> payment-service`);
  log(`  Succeeded (200): ${succeeded}`);
  log(`  Rate limited (429): ${rateLimited}`);
  if (other > 0) log(`  Other status codes: ${other}`);

  if (rateLimited > 0) {
    distinctThreats.add("flood_rate_limit");
  }

  log("");
}

async function stage5() {
  log("Stage 5: Simulating request from disallowed region...");

  const token = await fetchToken("user-service");

  log("  Attempt 1: request with X-Simulated-Region: RU");
  const attempt1 = await fetch(`${PROXY_URL}/route/payment-service/data`, {
    headers: { Authorization: `Bearer ${token}`, "X-Simulated-Region": "RU" },
  });
  const body1 = await attempt1.json().catch(() => null);
  log(`    HTTP ${attempt1.status}${body1 && body1.reason ? ` — ${body1.reason}` : ""}`);

  if (attempt1.status === 428) {
    log("  428 received — fetching a fresh token and retrying once (per proxy contract)...");
    const freshToken = await fetchToken("user-service");
    const attempt2 = await fetch(`${PROXY_URL}/route/payment-service/data`, {
      headers: { Authorization: `Bearer ${freshToken}`, "X-Simulated-Region": "RU" },
    });
    const body2 = await attempt2.json().catch(() => null);
    log(`  Attempt 2 (retry with fresh token, region still RU): HTTP ${attempt2.status}${body2 && body2.reason ? ` — ${body2.reason}` : ""}`);

    if (attempt2.status === 428) {
      log("  Retry also failed the context check — treating as final hard failure (403), matching calling-service behavior");
      distinctThreats.add("context_violation_region");
    }
  }

  log("");
}

async function stage6() {
  log("Stage 6: Summary");

  const metricsRes = await fetch(`${PROXY_URL}/metrics`);
  const metrics = await metricsRes.json();

  const alertsRes = await fetch(`${PROXY_URL}/alerts`);
  const { alerts: allAlerts } = await alertsRes.json();
  const alertsThisRun = allAlerts.filter((a) => new Date(a.timestamp).getTime() >= runStartedAt);

  const logsRes = await fetch(`${PROXY_URL}/logs`);
  const { logs: allLogs } = await logsRes.json();
  const logsThisRun = allLogs.filter((e) => new Date(e.timestamp).getTime() >= runStartedAt);

  // /logs is capped at the last 100 entries total (Step 10), across ALL
  // callers — if this run's own traffic plus whatever else hit the proxy
  // concurrently exceeds 100, older entries from THIS run could already
  // have been trimmed before we ever read them back. Flagged explicitly
  // rather than silently under-reporting as if it were the true total.
  const possiblyTruncated = allLogs.length >= 100;

  const blockedOrReauth = logsThisRun.filter((e) =>
    ["blocked_identity", "blocked_rbac", "reauth_required", "blocked_rate_limit"].includes(e.decision)
  ).length;

  log(`  Requests logged this run: ${logsThisRun.length}${possiblyTruncated ? " (NOTE: /logs is capped at 100 total entries across all traffic — this count may be missing early requests from this run if the cap was hit)" : ""}`);
  log(`  Average proxy checkpoint latency (last 100 entries, all traffic): ${metrics.avgMs.toFixed(2)}ms`);
  log(`  Security alerts recorded this run: ${alertsThisRun.length} (of ${allAlerts.length} total since proxy start)`);
  log(`  Blocked / reauth-required events this run: ${blockedOrReauth}`);
  log("");
  log(`Attack simulation complete. System detected and responded to ${distinctThreats.size} distinct threat pattern(s): ${[...distinctThreats].join(", ")}.`);
}

async function main() {
  runStartedAt = Date.now();
  await stage1();
  await stage2();
  await stage3();
  await stage4();
  await stage5();
  await stage6();
}

main().catch((err) => {
  console.error("Attack simulation failed:", err);
  process.exit(1);
});
