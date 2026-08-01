// Placeholder entrypoint — proxy logic not yet implemented.
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

app.get("/health", (req, res) => res.json({ status: "ok", service: "zero-trust-proxy" }));

app.listen(PORT, () => console.log(`zero-trust-proxy placeholder listening on ${PORT}`));
