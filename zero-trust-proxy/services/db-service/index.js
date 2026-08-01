require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5003;
const SERVICE_NAME = process.env.SERVICE_NAME || "db-service";
const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!SERVICE_SECRET) {
  console.error(`[${SERVICE_NAME}] FATAL: no SERVICE_SECRET found in env — identity not loaded`);
  process.exit(1);
}
console.log(`[${SERVICE_NAME}] identity loaded: ${SERVICE_NAME}`);

// All inter-service traffic now flows through the proxy's checkpoint —
// this service no longer resolves or calls target services' hosts directly.
const PROXY_URL = process.env.PROXY_URL || "http://localhost:4000";

async function fetchOwnToken() {
  console.log(`[${SERVICE_NAME}] requesting token from proxy for self ('${SERVICE_NAME}')`);
  const response = await fetch(`${PROXY_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service: SERVICE_NAME }),
  });

  if (!response.ok) {
    throw new Error(`proxy refused to issue token (status ${response.status})`);
  }

  const { token } = await response.json();
  console.log(`[${SERVICE_NAME}] received token from proxy`);
  return token;
}

// Calls a target service through the proxy, attaching a Bearer token.
// If the proxy responds 428 (context check failed, re-auth requested),
// fetches a FRESH token and retries exactly once. If the retry also
// comes back 428, that is treated as a hard failure (403) rather than
// looping — the proxy itself has no memory of retries, so this one-shot
// retry-then-give-up behavior lives here, in the calling service.
async function callThroughProxy(url, { headers = {}, body } = {}) {
  const method = body ? "POST" : "GET";
  const fetchOpts = (token) => ({
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let token = await fetchOwnToken();

  console.log(`[${SERVICE_NAME}] calling via proxy -> ${method} ${url} (with Bearer token attached)`);
  let response = await fetch(url, fetchOpts(token));

  if (response.status === 428) {
    const respBody = await response.json();
    console.warn(`[${SERVICE_NAME}] received 428 reauth_required: ${respBody.reason}`);
    console.log(`[${SERVICE_NAME}] fetching fresh token and retrying once`);

    token = await fetchOwnToken();
    response = await fetch(url, fetchOpts(token));

    if (response.status === 428) {
      console.error(`[${SERVICE_NAME}] retry also failed context check — giving up, hard fail 403`);
      const retryBody = await response.json();
      return {
        status: 403,
        data: { error: `context check failed after re-auth retry: ${retryBody.reason}` },
      };
    }
  }

  if (response.status === 429) {
    const rateBody = await response.json();
    console.warn(
      `[${SERVICE_NAME}] rate limited by proxy (429), retry after ${rateBody.retryAfterMs}ms — not retrying automatically`
    );
    return { status: 429, data: rateBody };
  }

  const data = await response.json();
  return { status: response.status, data };
}

const FAKE_RAW_RECORDS = [
  { table: "users", rowId: 1, checksum: "a1b2c3", updatedAt: "2026-07-28T10:15:00Z" },
  { table: "transactions", rowId: 12, checksum: "d4e5f6", updatedAt: "2026-07-29T08:42:00Z" },
  { table: "sessions", rowId: 88, checksum: "g7h8i9", updatedAt: "2026-07-31T22:00:00Z" },
];

app.get("/health", (req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

app.get("/data", (req, res) => {
  console.log(`[${SERVICE_NAME}] received GET /data`);
  res.json({ service: SERVICE_NAME, records: FAKE_RAW_RECORDS });
});

// Also accepts POST — used when a caller needs to attach a request body
// (e.g. to exercise the proxy's payload-size context check), even though
// this endpoint itself ignores the body content.
app.post("/data", (req, res) => {
  console.log(`[${SERVICE_NAME}] received POST /data`);
  res.json({ service: SERVICE_NAME, records: FAKE_RAW_RECORDS });
});

app.post("/call-service", async (req, res) => {
  const { target, path, region, payload } = req.body || {};

  if (!target || !path) {
    return res.status(400).json({ error: "request body must include 'target' and 'path'" });
  }

  // Routed through the proxy's checkpoint, not called directly.
  const url = `${PROXY_URL}/route/${target}${path}`;

  const extraHeaders = {};
  if (region) extraHeaders["X-Simulated-Region"] = region;

  const body = payload ? { filler: payload } : undefined;

  try {
    const { status, data } = await callThroughProxy(url, { headers: extraHeaders, body });
    console.log(`[${SERVICE_NAME}] received response from ${target} (status ${status})`);
    res.status(status).json({ from: SERVICE_NAME, target, data });
  } catch (err) {
    console.error(`[${SERVICE_NAME}] call to ${target} failed: ${err.message}`);
    res.status(502).json({ error: `failed to reach ${target}`, details: err.message });
  }
});

app.listen(PORT, () => console.log(`${SERVICE_NAME} listening on ${PORT}`));
