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

console.log("\n=== Calling get_security_alerts ===");
const alertsResult = await client.callTool({ name: "get_security_alerts", arguments: {} });

console.log("\n--- content[0].text ---");
console.log(alertsResult.content[0].text);

console.log("\n--- structuredContent.totalAlerts ---");
console.log(alertsResult.structuredContent.totalAlerts);

console.log("\nisError:", alertsResult.isError ?? false);

console.log("\n=== Calling explain_request_decision (user-service -> payment-service, known history) ===");
const knownResult = await client.callTool({
  name: "explain_request_decision",
  arguments: { callerService: "user-service", targetService: "payment-service" },
});

console.log("\n--- content[0].text ---");
console.log(knownResult.content[0].text);

console.log("\n--- structuredContent ---");
console.log(JSON.stringify(knownResult.structuredContent, null, 2));

console.log("\n=== Calling explain_request_decision (notification-service -> db-service, NO history) ===");
const unknownResult = await client.callTool({
  name: "explain_request_decision",
  arguments: { callerService: "notification-service", targetService: "db-service" },
});

console.log("\n--- content[0].text ---");
console.log(unknownResult.content[0].text);

console.log("\n--- structuredContent ---");
console.log(JSON.stringify(unknownResult.structuredContent, null, 2));

console.log("\n=== Calling check_rbac_policy (user-service -> payment-service, allowed) ===");
const rbacAllowed = await client.callTool({
  name: "check_rbac_policy",
  arguments: { callerService: "user-service", targetService: "payment-service" },
});
console.log("\n--- content[0].text ---");
console.log(rbacAllowed.content[0].text);
console.log("\n--- structuredContent ---");
console.log(JSON.stringify(rbacAllowed.structuredContent, null, 2));

console.log("\n=== Calling check_rbac_policy (user-service -> db-service, NOT allowed) ===");
const rbacDenied = await client.callTool({
  name: "check_rbac_policy",
  arguments: { callerService: "user-service", targetService: "db-service" },
});
console.log("\n--- content[0].text ---");
console.log(rbacDenied.content[0].text);
console.log("\n--- structuredContent ---");
console.log(JSON.stringify(rbacDenied.structuredContent, null, 2));

console.log("\n=== Calling run_attack_simulation (this takes a few seconds) ===");
const attackResult = await client.callTool({ name: "run_attack_simulation", arguments: {} });
console.log("\n--- content[0].text (full script output) ---");
console.log(attackResult.content[0].text);
console.log("\n--- structuredContent.summary ---");
console.log(attackResult.structuredContent.summary);
console.log("\nisError:", attackResult.isError ?? false);

await client.close();
process.exit(0);
