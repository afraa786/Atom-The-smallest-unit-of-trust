# zero-trust-proxy-mcp

MCP server exposing the Zero-Trust Proxy as tools for MCP-compatible clients
(Claude Desktop, Claude Code, and future MCP-enabled clients). Uses the
official `@modelcontextprotocol/sdk` with stdio transport.

## Tools

### `get_proxy_metrics`

Calls `GET {PROXY_URL}/metrics` on the live proxy and returns avg/min/max/p95
checkpoint latency plus a PASS/FAIL verdict against the 15ms real-time target.

Takes no arguments.

### `get_security_alerts`

Calls `GET {PROXY_URL}/alerts` and returns the raw alerts plus a summary of
which signals fired (`novel_target`, `rapid_fanout`) and which services were
involved.

Takes no arguments.

### `explain_request_decision`

Calls `GET {PROXY_URL}/logs?service=<callerService>` and finds the most
recent entry targeting `targetService`, then explains in plain language
whether it was allowed/blocked/reauth-required, why, whether a security
alert fired, and the latency. Says so clearly (does not guess) if the
pairing has no history.

Arguments: `callerService` (string), `targetService` (string) — both required.

### `check_rbac_policy`

Calls `GET {PROXY_URL}/policy/rbac` and checks whether `targetService` is in
`callerService`'s allowed list. Policy lookup only — does not make a live
request through the proxy, so it never triggers rate limiting or logging.

Arguments: `callerService` (string), `targetService` (string) — both required.

### `run_attack_simulation`

Runs `attack-stimulator/simulate-attack.js` as a child process against the
live proxy mesh and returns its full console output plus a short summary of
the distinct threat patterns detected. Takes 5-10 seconds.

Takes no arguments.

## Setup

```bash
npm install
npm run build
```

This compiles `src/index.ts` to `build/index.js`.

By default the server talks to the proxy at `http://localhost:4000`. Override
with the `PROXY_URL` environment variable if the proxy runs elsewhere.

The Zero-Trust Proxy (`../zero-trust-proxy`) must be running for the tool to
return data — start it first (`npm start` there, or via its docker-compose).

## Running standalone

```bash
npm start
```

This starts the server on stdio and blocks, waiting for an MCP client to
connect. It won't print anything to stdout (stdout is reserved for the MCP
protocol) — a "server running on stdio" line goes to stderr on startup.

## Testing without a full MCP client

A small test client is included that spawns the built server, lists its
tools, and calls `get_proxy_metrics`, printing the raw response:

```bash
node test/test-client.mjs
```

Or use the official inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Connecting to Claude Desktop

### 1. Build the server first

```bash
npm install
npm run build
```

Confirm `build/index.js` exists before continuing — Claude Desktop will fail
silently (tools just won't show up) if the path in step 2 doesn't resolve.

### 2. Edit Claude Desktop's config file

On Windows, the config file lives at:

```
%APPDATA%\Claude\claude_desktop_config.json
```

which expands to (in this dev environment):

```
C:\Users\Afraa\AppData\Roaming\Claude\claude_desktop_config.json
```

If the file doesn't exist yet, create it. Add (or merge in) this entry —
use the exact absolute path to this project's built server:

```json
{
  "mcpServers": {
    "zero-trust-proxy": {
      "command": "node",
      "args": ["C:/Users/Afraa/Downloads/atom/mcp-server/build/index.js"]
    }
  }
}
```

If you already have other `mcpServers` entries in that file, add
`"zero-trust-proxy"` as an additional key inside the existing object —
don't replace the whole file.

### 3. Start the backend BEFORE restarting Claude Desktop

The MCP server is a thin wrapper — every tool call fails or returns stale
data if the proxy and services aren't up. Start them first:

```bash
# from zero-trust-proxy/
npm start          # or: docker-compose up
```

This needs the proxy (port 4000) and all 4 dummy services (ports 5001-5004)
running. `run_attack_simulation` specifically needs all 5 processes healthy,
since it drives real traffic through the whole mesh.

Only after the backend is confirmed up (`curl http://localhost:4000/health`)
should you restart Claude Desktop — it launches configured MCP servers on
startup, so it needs to find a live proxy the first time it connects.

### 4. Restart Claude Desktop

Fully quit and reopen the app (not just close the window) so it re-reads
`claude_desktop_config.json` and spawns the new MCP server. Look for a
tools/plug icon in the chat input area to confirm the server connected —
it should list the 5 tools from this project.

### Example prompts to try once connected

- "Run the attack simulation and tell me what happened."
- "Why did payment-service get blocked calling db-service?"
- "Is user-service allowed to call db-service?"
- "What's our current proxy latency looking like?"

### Troubleshooting

- **Tools don't appear at all**: check the JSON is valid (trailing commas
  are a common break) and that the `args` path uses forward slashes or
  escaped backslashes — bare Windows backslashes in JSON are invalid escapes.
- **Tool calls return "Could not reach the Zero-Trust Proxy"**: the backend
  isn't running, or is running on a different port than `PROXY_URL` expects
  (default `http://localhost:4000`).
- **Changed proxy code and it's not reflected**: the proxy process needs a
  restart to pick up code changes — the MCP server just calls its HTTP API,
  it doesn't reload the proxy itself.

## ChatGPT web

Not currently supported, and it's not a config difference like Claude
Desktop vs. Claude Code — it's a transport mismatch. This server speaks MCP
over **stdio** (a local child process Claude Desktop spawns and talks to
over stdin/stdout). ChatGPT's web app only connects to **remote** MCP
servers over Streamable HTTP/SSE at a public URL — it can't spawn a local
process on your machine at all.

To support ChatGPT web, this project would need:

1. A second transport added to `src/index.ts` (the SDK supports
   `StreamableHTTPServerTransport` alongside the existing stdio one) so the
   same tools are served over HTTP instead of stdin/stdout.
2. The server running as a persistent process (not spawned per-session) and
   reachable at a public HTTPS URL — e.g. tunneled with ngrok for local dev,
   or actually deployed somewhere, since ChatGPT's servers need to reach it
   over the internet, not `localhost`.
3. Exposing your local zero-trust-proxy to the public internet this way is a
   real consideration to weigh, not just a config step — worth deciding
   deliberately rather than as a side effect of wiring up ChatGPT.

Not built here. Ask if you want the HTTP transport added later.
