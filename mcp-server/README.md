# zero-trust-proxy-mcp

MCP server exposing the Zero-Trust Proxy as tools for MCP-compatible clients
(Claude Desktop, Claude Code, and future MCP-enabled clients). Uses the
official `@modelcontextprotocol/sdk` with stdio transport.

## Tools

### `get_proxy_metrics`

Calls `GET {PROXY_URL}/metrics` on the live proxy and returns avg/min/max/p95
checkpoint latency plus a PASS/FAIL verdict against the 15ms real-time target.

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

Add to `claude_desktop_config.json`:

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

Restart Claude Desktop after editing. The proxy must be running locally for
the tool to return live data.
