"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Pairing = {
  caller: string;
  target: string;
  reason: string;
};

// Mirrors the live RBAC map served by GET /policy/rbac on the deployed
// proxy (config/load-mesh-config.js -> mesh.config.json). All 16
// possible caller/target pairings across the 4 services (4x4,
// including self-calls) — 3 allowed, 13 denied by default.
const ALLOWED: Pairing[] = [
  {
    caller: "user-service",
    target: "payment-service",
    reason:
      "user-service needs to hand off to payment-service to process a transaction — this is the one path it's explicitly granted.",
  },
  {
    caller: "payment-service",
    target: "db-service",
    reason:
      "payment-service needs to read and write transaction records, so it's permitted to reach db-service directly.",
  },
  {
    caller: "payment-service",
    target: "notification-service",
    reason:
      "payment-service is allowed to reach notification-service to trigger 'payment confirmed' alerts.",
  },
];

const DENIED: Pairing[] = [
  {
    caller: "user-service",
    target: "db-service",
    reason:
      "user-service was never granted permission to reach db-service. A valid identity isn't the same as permission.",
  },
  {
    caller: "user-service",
    target: "notification-service",
    reason:
      "user-service has exactly one allowed target: payment-service. Everything else is denied by default.",
  },
  {
    caller: "user-service",
    target: "user-service",
    reason:
      "Nothing gets a free pass just because it's calling itself — every target has to be explicitly permitted.",
  },
  {
    caller: "payment-service",
    target: "user-service",
    reason:
      "Permissions aren't symmetric. payment-service can call downstream services, but nothing lets it reach back upstream into user-service.",
  },
  {
    caller: "payment-service",
    target: "payment-service",
    reason:
      "Same self-call rule applies here — payment-service calling itself is still denied. No implicit trust, even for a service talking to itself.",
  },
  {
    caller: "db-service",
    target: "user-service",
    reason:
      "db-service has zero outbound permissions. It's a dead end — something that gets called, never something that calls out.",
  },
  {
    caller: "db-service",
    target: "payment-service",
    reason:
      "If db-service were ever compromised, this rule alone stops it from pivoting into the payment layer.",
  },
  {
    caller: "db-service",
    target: "notification-service",
    reason:
      "db-service has no allowed targets whatsoever — this is what a properly locked-down data layer looks like.",
  },
  {
    caller: "db-service",
    target: "db-service",
    reason:
      "Even calling itself is denied — db-service has no allowed targets at all, not even a self-loop.",
  },
  {
    caller: "notification-service",
    target: "user-service",
    reason:
      "notification-service also has zero outbound permissions — it only receives triggers and sends alerts outward, never calls back into the mesh.",
  },
  {
    caller: "notification-service",
    target: "payment-service",
    reason:
      "Same zero-outbound rule — notification-service can't reach payment-service either, even though payment-service can reach it.",
  },
  {
    caller: "notification-service",
    target: "db-service",
    reason:
      "notification-service can't reach db-service. It sits at the end of the chain: things call it, it calls nothing.",
  },
  {
    caller: "notification-service",
    target: "notification-service",
    reason:
      "Not even a self-call is permitted — notification-service has no allowed targets whatsoever, including itself.",
  },
];

export default function RBACMatrix() {
  return (
    <section className="relative bg-black py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-3 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            Who&apos;s <span className="text-lime-green">allowed</span> to reach whom
          </h2>
          <p className="mt-4 text-cool-white/70">
            The real RBAC policy enforced by the live proxy — every one of the
            16 possible pairings across the 4 services, and exactly why each
            one is allowed or denied.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Allowed column */}
          <div>
            <div className="mb-4 flex items-center gap-2 px-1">
              <CheckCircle2 className="size-4 text-lime-green" />
              <span className="text-xs font-bold uppercase tracking-widest text-lime-green">
                Allowed ({ALLOWED.length})
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {ALLOWED.map((p, i) => (
                <PairingCard key={`${p.caller}->${p.target}`} pairing={p} allowed delay={i * 0.04} />
              ))}
            </div>
          </div>

          {/* Denied column */}
          <div>
            <div className="mb-4 flex items-center gap-2 px-1">
              <XCircle className="size-4 text-red-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                Denied ({DENIED.length})
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {DENIED.map((p, i) => (
                <PairingCard key={`${p.caller}->${p.target}`} pairing={p} allowed={false} delay={i * 0.04} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PairingCard({
  pairing,
  allowed,
  delay,
}: {
  pairing: Pairing;
  allowed: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-xl",
        allowed
          ? "border-lime-green/25 bg-lime-green/[0.04]"
          : "border-red-500/20 bg-red-500/[0.04]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          allowed ? "bg-lime-green/15" : "bg-red-500/15"
        )}
      >
        {allowed ? (
          <CheckCircle2 className="size-4 text-lime-green" />
        ) : (
          <XCircle className="size-4 text-red-400" />
        )}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold text-cool-white">
          {pairing.caller} <span className="text-cool-white/40">&rarr;</span> {pairing.target}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-cool-white/60">{pairing.reason}</p>
      </div>
    </motion.div>
  );
}
