#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// mcp-server/build/index.js -> ../../attack-stimulator/simulate-attack.js
const ATTACK_SCRIPT_PATH = path.join(__dirname, "..", "..", "attack-stimulator", "simulate-attack.js");

const PROXY_URL = process.env.PROXY_URL ?? "http://localhost:4000";
const LATENCY_TARGET_MS = 15;

interface ProxyMetrics {
  avgMs: number;
  maxMs: number;
  minMs: number;
  p95Ms: number;
  sampleSize: number;
}

interface SecurityAlert {
  timestamp: string;
  caller: string;
  target: string;
  signal: string;
  details: string;
}

interface LogEntry {
  timestamp: string;
  caller: string;
  target: string;
  decision: string;
  reason: string | null;
  securityAlert: string | null;
  latencyMs: number;
}

const server = new McpServer({
  name: "zero-trust-proxy-mcp",
  version: "0.1.0",
});

server.registerTool(
  "get_proxy_metrics",
  {
    title: "Get Zero-Trust Proxy Metrics",
    description:
      "Fetches live latency metrics (avg/max/min/p95) from the running Zero-Trust Proxy's /metrics endpoint and reports whether checkpoint latency is within the 15ms real-time target.",
    inputSchema: {},
    outputSchema: {
      avgMs: z.number(),
      minMs: z.number(),
      maxMs: z.number(),
      p95Ms: z.number(),
      sampleSize: z.number(),
      latencyTargetMs: z.number(),
      withinTarget: z.boolean(),
    },
  },
  async () => {
    let res: Response;
    try {
      res = await fetch(`${PROXY_URL}/metrics`);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Could not reach the Zero-Trust Proxy at ${PROXY_URL}. Is it running? (${
              err instanceof Error ? err.message : String(err)
            })`,
          },
        ],
        isError: true,
      };
    }

    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Proxy responded with HTTP ${res.status} for GET ${PROXY_URL}/metrics.`,
          },
        ],
        isError: true,
      };
    }

    const metrics = (await res.json()) as ProxyMetrics;
    const withinTarget = metrics.avgMs <= LATENCY_TARGET_MS;
    const verdict = withinTarget
      ? `PASS — average checkpoint latency (${metrics.avgMs.toFixed(2)}ms) is within the ${LATENCY_TARGET_MS}ms real-time target.`
      : `FAIL — average checkpoint latency (${metrics.avgMs.toFixed(2)}ms) exceeds the ${LATENCY_TARGET_MS}ms real-time target.`;

    return {
      content: [
        {
          type: "text",
          text: [
            `Zero-Trust Proxy latency metrics (sample size: ${metrics.sampleSize}):`,
            `  avg: ${metrics.avgMs.toFixed(4)}ms`,
            `  min: ${metrics.minMs.toFixed(4)}ms`,
            `  max: ${metrics.maxMs.toFixed(4)}ms`,
            `  p95: ${metrics.p95Ms.toFixed(4)}ms`,
            "",
            verdict,
          ].join("\n"),
        },
      ],
      structuredContent: {
        ...metrics,
        latencyTargetMs: LATENCY_TARGET_MS,
        withinTarget,
      },
    };
  }
);

server.registerTool(
  "get_security_alerts",
  {
    title: "Get Security Alerts",
    description:
      "Fetches all behavioral security alerts (novel_target, rapid_fanout signals) recorded by the Zero-Trust Proxy's lateral-movement detector, plus a natural-language summary of what fired and which services were involved.",
    inputSchema: {},
    outputSchema: {
      totalAlerts: z.number(),
      alerts: z.array(
        z.object({
          timestamp: z.string(),
          caller: z.string(),
          target: z.string(),
          signal: z.string(),
          details: z.string(),
        })
      ),
    },
  },
  async () => {
    let res: Response;
    try {
      res = await fetch(`${PROXY_URL}/alerts`);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Could not reach the Zero-Trust Proxy at ${PROXY_URL}. Is it running? (${
              err instanceof Error ? err.message : String(err)
            })`,
          },
        ],
        isError: true,
      };
    }

    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Proxy responded with HTTP ${res.status} for GET ${PROXY_URL}/alerts.`,
          },
        ],
        isError: true,
      };
    }

    const { alerts } = (await res.json()) as { alerts: SecurityAlert[] };

    if (alerts.length === 0) {
      return {
        content: [{ type: "text", text: "No security alerts have been recorded since the proxy started." }],
        structuredContent: { totalAlerts: 0, alerts: [] },
      };
    }

    const bySignal = new Map<string, SecurityAlert[]>();
    for (const alert of alerts) {
      const list = bySignal.get(alert.signal) ?? [];
      list.push(alert);
      bySignal.set(alert.signal, list);
    }

    const signalLines = [...bySignal.entries()].map(([signal, entries]) => {
      const pairs = [...new Set(entries.map((e) => `${e.caller} -> ${e.target}`))];
      return `  ${signal} (${entries.length}): ${pairs.join(", ")}`;
    });

    const summary = [
      `${alerts.length} total security alert(s) recorded since the proxy started.`,
      "Breakdown by signal type:",
      ...signalLines,
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: `${summary}\n\nRaw alerts:\n${JSON.stringify(alerts, null, 2)}`,
        },
      ],
      structuredContent: { totalAlerts: alerts.length, alerts },
    };
  }
);

server.registerTool(
  "explain_request_decision",
  {
    title: "Explain Request Decision",
    description:
      "Looks up the most recent request from callerService to targetService in the Zero-Trust Proxy's request log and explains, in plain language, what happened: allowed, blocked, or reauth-required, the specific reason, whether a security alert fired, and the latency. If no such request has ever been made, says so instead of guessing.",
    inputSchema: {
      callerService: z.string().describe("The calling service, e.g. 'user-service'"),
      targetService: z.string().describe("The target service, e.g. 'payment-service'"),
    },
    outputSchema: {
      found: z.boolean(),
      callerService: z.string(),
      targetService: z.string(),
      entry: z
        .object({
          timestamp: z.string(),
          decision: z.string(),
          reason: z.string().nullable(),
          securityAlert: z.string().nullable(),
          latencyMs: z.number(),
        })
        .optional(),
    },
  },
  async ({ callerService, targetService }) => {
    let res: Response;
    try {
      res = await fetch(`${PROXY_URL}/logs?service=${encodeURIComponent(callerService)}`);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Could not reach the Zero-Trust Proxy at ${PROXY_URL}. Is it running? (${
              err instanceof Error ? err.message : String(err)
            })`,
          },
        ],
        isError: true,
      };
    }

    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Proxy responded with HTTP ${res.status} for GET ${PROXY_URL}/logs?service=${callerService}.`,
          },
        ],
        isError: true,
      };
    }

    const { logs } = (await res.json()) as { logs: LogEntry[] };
    // /logs returns newest-first, so the first match is the most recent request for this pairing.
    const entry = logs.find((log) => log.target === targetService);

    if (!entry) {
      return {
        content: [
          {
            type: "text",
            text: `No record found: ${callerService} has never called ${targetService} through the proxy (or no matching log entry exists in the current in-memory log). Not fabricating a result — this pairing has no history.`,
          },
        ],
        structuredContent: { found: false, callerService, targetService },
      };
    }

    const decisionExplain: Record<string, string> = {
      allowed: "the request was allowed through every checkpoint",
      blocked_identity: "the request was blocked at identity verification (missing/invalid token)",
      blocked_rbac: "the request was blocked by RBAC (caller not authorized to reach this target)",
      blocked_rate_limit: "the request was blocked by the rate limiter",
      reauth_required: "the request failed a context check (time/geo/payload) and re-authentication was required",
    };

    const plainDecision = decisionExplain[entry.decision] ?? entry.decision;
    const alertLine = entry.securityAlert
      ? `A security alert also fired alongside this request: ${entry.securityAlert}.`
      : "No security alert fired alongside this request.";

    const explanation = [
      `Most recent request from ${callerService} to ${targetService} (at ${entry.timestamp}):`,
      `Decision: ${entry.decision} — ${plainDecision}.`,
      entry.reason ? `Reason: ${entry.reason}` : "No specific reason was recorded (request was clean).",
      alertLine,
      `Latency: ${entry.latencyMs.toFixed(4)}ms.`,
    ].join("\n");

    return {
      content: [{ type: "text", text: explanation }],
      structuredContent: {
        found: true,
        callerService,
        targetService,
        entry: {
          timestamp: entry.timestamp,
          decision: entry.decision,
          reason: entry.reason,
          securityAlert: entry.securityAlert,
          latencyMs: entry.latencyMs,
        },
      },
    };
  }
);

server.registerTool(
  "check_rbac_policy",
  {
    title: "Check RBAC Policy",
    description:
      "Looks up whether callerService is allowed to reach targetService under the Zero-Trust Proxy's static RBAC policy. This is a policy lookup only — it does not make a live request through the proxy, so it never triggers rate limiting, context checks, or logging.",
    inputSchema: {
      callerService: z.string().describe("The calling service, e.g. 'user-service'"),
      targetService: z.string().describe("The target service, e.g. 'payment-service'"),
    },
    outputSchema: {
      callerService: z.string(),
      targetService: z.string(),
      allowed: z.boolean(),
      callerAllowedTargets: z.array(z.string()),
    },
  },
  async ({ callerService, targetService }) => {
    let res: Response;
    try {
      res = await fetch(`${PROXY_URL}/policy/rbac`);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Could not reach the Zero-Trust Proxy at ${PROXY_URL}. Is it running? (${
              err instanceof Error ? err.message : String(err)
            })`,
          },
        ],
        isError: true,
      };
    }

    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Proxy responded with HTTP ${res.status} for GET ${PROXY_URL}/policy/rbac.`,
          },
        ],
        isError: true,
      };
    }

    const rbacMap = (await res.json()) as Record<string, string[]>;
    const callerAllowedTargets = rbacMap[callerService] ?? [];
    const allowed = callerAllowedTargets.includes(targetService);

    if (!(callerService in rbacMap)) {
      return {
        content: [
          {
            type: "text",
            text: `'${callerService}' is not a registered service in the RBAC policy, so it has no allowed targets. ${targetService} would NOT be reachable.`,
          },
        ],
        structuredContent: { callerService, targetService, allowed: false, callerAllowedTargets: [] },
      };
    }

    const verdict = allowed
      ? `YES — ${callerService} IS allowed to reach ${targetService}.`
      : `NO — ${callerService} is NOT allowed to reach ${targetService}.`;

    const contextLine =
      callerAllowedTargets.length > 0
        ? `${callerService} is allowed to reach: ${callerAllowedTargets.join(", ")}.`
        : `${callerService} is not allowed to reach any service.`;

    return {
      content: [{ type: "text", text: `${verdict}\n${contextLine}` }],
      structuredContent: { callerService, targetService, allowed, callerAllowedTargets },
    };
  }
);

server.registerTool(
  "run_attack_simulation",
  {
    title: "Run Attack Simulation",
    description:
      "Runs the full attack-stimulator/simulate-attack.js script against the live Zero-Trust Proxy mesh as a child process and returns its complete console output, plus a short summary of the distinct threat patterns the proxy detected and responded to. Takes 5-10 seconds; requires the proxy and all 4 dummy services to be running.",
    inputSchema: {},
    outputSchema: {
      summary: z.string().nullable(),
      fullOutput: z.string(),
    },
  },
  async () => {
    let stdout: string;
    let stderr: string;
    try {
      const result = await execFileAsync(process.execPath, [ATTACK_SCRIPT_PATH], {
        env: process.env,
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err) {
      const execErr = err as { stdout?: string; stderr?: string; message: string };
      return {
        content: [
          {
            type: "text",
            text: `Attack simulation script failed to complete: ${execErr.message}\n\n--- stdout ---\n${
              execErr.stdout ?? "(none)"
            }\n\n--- stderr ---\n${execErr.stderr ?? "(none)"}`,
          },
        ],
        isError: true,
      };
    }

    const summaryMatch = stdout.match(/Attack simulation complete\..*$/m);
    const summary = summaryMatch ? summaryMatch[0] : null;

    return {
      content: [
        {
          type: "text",
          text: stderr ? `${stdout}\n\n--- stderr ---\n${stderr}` : stdout,
        },
      ],
      structuredContent: { summary, fullOutput: stdout },
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("zero-trust-proxy-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting zero-trust-proxy-mcp server:", err);
  process.exit(1);
});
