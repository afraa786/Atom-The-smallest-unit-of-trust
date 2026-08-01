"use client";

import { motion } from "framer-motion";

const THREATS = [
  { name: "Suspicious login — APAC", severity: "High", status: "Contained" },
  { name: "Port scan detected — edge-3", severity: "Medium", status: "Monitoring" },
  { name: "Malware signature match", severity: "Critical", status: "Resolved" },
  { name: "Unusual data egress", severity: "High", status: "Investigating" },
];

const SEVERITY_COLOR: Record<string, string> = {
  Critical: "text-red-400 border-red-400/40 bg-red-400/10",
  High: "text-lime-green border-lime-green/40 bg-lime-green/10",
  Medium: "text-cool-white border-cool-white/30 bg-cool-white/10",
};

export default function DashboardPreview() {
  return (
    <section id="product" className="relative bg-black py-28">
      <div className="mx-auto max-w-7xl px-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            Threat monitoring, <span className="text-lime-green">live</span>
          </h2>
          <p className="mt-4 text-cool-white/70">
            A single pane of glass for every signal atom is watching.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="glow-lime rounded-3xl border border-ocean-blue/60 bg-charcoal-surface p-4 shadow-[0_0_60px_-15px_rgba(59,30,255,0.5)] sm:p-8"
        >
          {/* Fake window chrome */}
          <div className="mb-6 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
            <span className="h-3 w-3 rounded-full bg-lime-green/70" />
            <span className="ml-4 text-xs text-cool-white/40">
              atom — Security Operations Center
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Status widgets */}
            <div className="lg:col-span-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Active Agents", value: "128" },
                { label: "Threats Blocked (24h)", value: "1,942" },
                { label: "Avg Response Time", value: "0.8s" },
                { label: "System Health", value: "99.98%" },
              ].map((w) => (
                <div
                  key={w.label}
                  className="rounded-xl border border-ocean-blue/40 bg-black/60 p-4"
                >
                  <div className="text-2xl font-bold text-lime-green">
                    {w.value}
                  </div>
                  <div className="mt-1 text-xs text-cool-white/50">
                    {w.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Fake graph */}
            <div className="lg:col-span-2 rounded-xl border border-ocean-blue/40 bg-black/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-cool-white/80">
                  Threat Volume — Last 24h
                </span>
                <span className="text-xs text-lime-green">● Live</span>
              </div>
              <svg viewBox="0 0 400 140" className="h-32 w-full">
                <polyline
                  fill="none"
                  stroke="#6EADBC"
                  strokeWidth="2"
                  points="0,110 40,90 80,100 120,60 160,80 200,40 240,70 280,30 320,55 360,20 400,45"
                />
                <polyline
                  fill="none"
                  stroke="#1B5E20"
                  strokeWidth="2.5"
                  points="0,130 40,120 80,125 120,100 160,110 200,70 240,90 280,50 320,65 360,35 400,55"
                />
              </svg>
            </div>

            {/* Threat feed */}
            <div className="rounded-xl border border-ocean-blue/40 bg-black/60 p-5">
              <span className="mb-4 block text-sm font-semibold text-cool-white/80">
                Live Threat Feed
              </span>
              <ul className="space-y-3">
                {THREATS.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-cool-white/70">{t.name}</span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 font-semibold ${SEVERITY_COLOR[t.severity]}`}
                    >
                      {t.severity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
