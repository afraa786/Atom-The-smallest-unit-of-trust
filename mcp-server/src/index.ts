#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const PROXY_URL = process.env.PROXY_URL ?? "http://localhost:4000";
const LATENCY_TARGET_MS = 15;

interface ProxyMetrics {
  avgMs: number;
  maxMs: number;
  minMs: number;
  p95Ms: number;
  sampleSize: number;
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("zero-trust-proxy-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting zero-trust-proxy-mcp server:", err);
  process.exit(1);
});
