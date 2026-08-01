// Standalone test client: spawns the built MCP server over stdio,
// lists its tools, then calls get_proxy_metrics and prints the result.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "..", "build", "index.js");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
});

const client = new Client({ name: "zero-trust-proxy-mcp-test-client", version: "0.1.0" });

await client.connect(transport);

const { tools } = await client.listTools();
console.log("=== Tools exposed by server ===");
console.log(tools.map((t) => `${t.name} — ${t.description}`).join("\n"));

console.log("\n=== Calling get_proxy_metrics ===");
const result = await client.callTool({ name: "get_proxy_metrics", arguments: {} });

console.log("\n--- content[0].text ---");
console.log(result.content[0].text);

console.log("\n--- structuredContent ---");
console.log(JSON.stringify(result.structuredContent, null, 2));

console.log("\nisError:", result.isError ?? false);

await client.close();
process.exit(0);
