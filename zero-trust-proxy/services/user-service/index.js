// Placeholder entrypoint — service logic not yet implemented.
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5001;

app.get("/health", (req, res) => res.json({ status: "ok", service: "user-service" }));

app.listen(PORT, () => console.log(`user-service placeholder listening on ${PORT}`));
