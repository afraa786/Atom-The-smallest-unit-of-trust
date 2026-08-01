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

const SERVICE_HOSTS = {
  "user-service": process.env.USER_SERVICE_URL || "http://localhost:5001",
  "payment-service": process.env.PAYMENT_SERVICE_URL || "http://localhost:5002",
  "db-service": process.env.DB_SERVICE_URL || "http://localhost:5003",
};

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

app.post("/call-service", async (req, res) => {
  const { target, path } = req.body || {};

  if (!target || !path) {
    return res.status(400).json({ error: "request body must include 'target' and 'path'" });
  }

  const baseUrl = SERVICE_HOSTS[target];
  if (!baseUrl) {
    return res.status(400).json({ error: `unknown target service '${target}'` });
  }

  const url = `${baseUrl}${path}`;
  console.log(`[${SERVICE_NAME}] calling ${target} -> GET ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`[${SERVICE_NAME}] received response from ${target} (status ${response.status})`);
    res.status(response.status).json({ from: SERVICE_NAME, target, data });
  } catch (err) {
    console.error(`[${SERVICE_NAME}] call to ${target} failed: ${err.message}`);
    res.status(502).json({ error: `failed to reach ${target}`, details: err.message });
  }
});

app.listen(PORT, () => console.log(`${SERVICE_NAME} listening on ${PORT}`));
