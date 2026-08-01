// Placeholder entrypoint — service logic not yet implemented.
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5002;

app.get("/health", (req, res) => res.json({ status: "ok", service: "payment-service" }));

app.listen(PORT, () => console.log(`payment-service placeholder listening on ${PORT}`));
