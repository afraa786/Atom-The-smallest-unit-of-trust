"use client";

import { motion } from "framer-motion";
import MCPBeamDiagram from "@/components/MCPBeamDiagram";

const DOC_BLOCKS = [
  {
    title: "get_proxy_metrics",
    badge: "tool",
    body: "Fetches live latency metrics (avg / max / min / p95) from the proxy's /metrics endpoint and evaluates whether checkpoint latency is within the 15 ms real-time target. Returns structured JSON plus a PASS / FAIL verdict.",
  },
  {
    title: "get_security_alerts",
    badge: "tool",
    body: "Retrieves all behavioral security alerts recorded by the lateral-movement detector — novel_target and rapid_fanout signals — grouped by signal type. Returns a natural-language breakdown of which services triggered each signal.",
  },
  {
    title: "explain_request_decision",
    badge: "tool",
    body: "Looks up the most recent call from a callerService to a targetService in the proxy's request log. Explains in plain language whether it was allowed, RBAC-blocked, context-rejected, or rate-limited — plus whether a security alert fired alongside it.",
  },
  {
    title: "check_rbac_policy",
    badge: "tool",
    body: "Performs a static policy lookup against the proxy's RBAC table without making a live request. Returns whether a given caller is allowed to reach a given target, and lists every target the caller is permitted to call.",
  },
  {
    title: "run_attack_simulation",
    badge: "tool",
    body: "Executes the full simulate-attack.js script as a child process against the live proxy mesh. Covers six threat stages — unauthorized lateral access, rapid fan-out, rate flooding, region-blocked re-auth — and returns the complete console output plus a summary of signals detected.",
  },
  {
    title: "Security expectations",
    badge: "note",
    body: "Do not persist generated JWTs in Claude conversations or local logs. Each MCP tool call goes through the same enforcement pipeline as a real service request — identity, RBAC, context checks, and rate limiting all apply. The MCP server never bypasses the proxy.",
  },
];

const CONFIG_SNIPPET = `{
  "mcpServers": {
    "zero-trust-proxy-mcp": {
      "command": "node",
      "args": ["./mcp-server/build/index.js"],
      "env": {
        "PROXY_URL": "http://localhost:4000"
      }
    }
  }
}`;

const TOOL_SNIPPET = `// Inspect live proxy health
get_proxy_metrics()

// Audit behavioral alerts
get_security_alerts()

// Explain a specific call
explain_request_decision({
  callerService: "user-service",
  targetService: "payment-service"
})

// Check RBAC without a live call
check_rbac_policy({
  callerService: "user-service",
  targetService: "db-service"
})

// Trigger a full attack simulation
run_attack_simulation()`;

const BADGE_STYLES: Record<string, string> = {
  tool: "bg-ocean-blue/15 text-ocean-blue border border-ocean-blue/30",
  note: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30",
};

export default function MCPSection() {
  return (
    <section id="mcp" className="relative overflow-hidden bg-black py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,173,188,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-3 sm:px-0">

        {/* Heading — styled like "How atom works" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            Claude <span className="text-ocean-blue">MCP</span> integration
          </h2>
          <p className="mt-4 text-cool-white/70">
            A fully implemented MCP server that gives Claude structured, live
            access to every Atom proxy endpoint — without bypassing the
            zero-trust enforcement pipeline.
          </p>
        </motion.div>

        {/* Animated beam diagram & Claude MCP Video side-by-side */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-14 grid grid-cols-1 gap-8 items-center lg:grid-cols-2"
        >
          <div className="w-full">
            <MCPBeamDiagram />
          </div>
          <div className="relative w-full">
            <div className="absolute -inset-4 rounded-full bg-ocean-blue/15 blur-2xl" />
            <div className="glass-panel relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <iframe
                src="https://drive.google.com/file/d/1Zr0BoPTKQ-CcSebywH4BfepvjkH2edG6/preview"
                className="aspect-video w-full rounded-[22px] border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Claude MCP Integration Video"
              />
            </div>
          </div>
        </motion.div>

        {/* Doc blocks grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          {DOC_BLOCKS.map((block) => (
            <article
              key={block.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${BADGE_STYLES[block.badge] ?? ""}`}
                >
                  {block.badge}
                </span>
                <h3 className="font-mono text-sm font-bold text-cool-white">
                  {block.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-cool-white/65">
                {block.body}
              </p>
            </article>
          ))}
        </motion.div>

        {/* Code panels */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-5 grid gap-5 lg:grid-cols-2"
        >
          <CodePanel title="Claude Desktop config (claude_desktop_config.json)" code={CONFIG_SNIPPET} />
          <CodePanel title="Tool call examples" code={TOOL_SNIPPET} />
        </motion.div>
      </div>
    </section>
  );
}

function CodePanel({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/45">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cool-white/60">
          {title}
        </h3>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-cool-white/75">
        {code}
      </pre>
    </div>
  );
}
