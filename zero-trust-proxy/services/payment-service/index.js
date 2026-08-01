require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";
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

const FAKE_TRANSACTIONS = [
  { id: "txn_001", userId: 1, amount: 42.5, currency: "USD", status: "completed" },
  { id: "txn_002", userId: 2, amount: 15.0, currency: "USD", status: "pending" },
  { id: "txn_003", userId: 1, amount: 99.99, currency: "USD", status: "completed" },
];

app.get("/health", (req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

app.get("/data", (req, res) => {
  console.log(`[${SERVICE_NAME}] received GET /data`);
  res.json({ service: SERVICE_NAME, records: FAKE_TRANSACTIONS });
});

app.post("/call-service", async (req, res) => {
  const { target, path } = req.body || {};

  if (!target || !path) {
    return res.status(400).json({ error: "request body must include 'target' and 'path'" });
  }

  // Routed through the proxy's checkpoint, not called directly.
  const url = `${PROXY_URL}/route/${target}${path}`;

  try {
    const token = await fetchOwnToken();

    console.log(`[${SERVICE_NAME}] calling ${target} via proxy -> GET ${url} (with Bearer token attached)`);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(`[${SERVICE_NAME}] received response from ${target} (status ${response.status})`);
    res.status(response.status).json({ from: SERVICE_NAME, target, data });
  } catch (err) {
    console.error(`[${SERVICE_NAME}] call to ${target} failed: ${err.message}`);
    res.status(502).json({ error: `failed to reach ${target}`, details: err.message });
  }
});

app.listen(PORT, () => console.log(`${SERVICE_NAME} listening on ${PORT}`));
