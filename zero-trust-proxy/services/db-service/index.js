// Placeholder entrypoint — service logic not yet implemented.
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5003;

app.get("/health", (req, res) => res.json({ status: "ok", service: "db-service" }));

app.listen(PORT, () => console.log(`db-service placeholder listening on ${PORT}`));
