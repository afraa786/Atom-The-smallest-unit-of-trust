require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";
const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!SERVICE_SECRET) {
  console.error(`[${SERVICE_NAME}] FATAL: no SERVICE_SECRET found in env — identity not loaded`);
  process.exit(1);
}
console.log(`[${SERVICE_NAME}] identity loaded: ${SERVICE_NAME}`);

// Maps service names to their base URL. Uses docker-compose service DNS names
// when running in a container network, falls back to localhost for local dev.
const SERVICE_HOSTS = {
  "user-service": process.env.USER_SERVICE_URL || "http://localhost:5001",
  "payment-service": process.env.PAYMENT_SERVICE_URL || "http://localhost:5002",
  "db-service": process.env.DB_SERVICE_URL || "http://localhost:5003",
};

const FAKE_USERS = [
  { id: 1, name: "Ava Chen", email: "ava.chen@example.com", role: "admin" },
  { id: 2, name: "Marcus Ibe", email: "marcus.ibe@example.com", role: "user" },
  { id: 3, name: "Priya Nair", email: "priya.nair@example.com", role: "user" },
];

app.get("/health", (req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

app.get("/data", (req, res) => {
  console.log(`[${SERVICE_NAME}] received GET /data`);
  res.json({ service: SERVICE_NAME, records: FAKE_USERS });
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
