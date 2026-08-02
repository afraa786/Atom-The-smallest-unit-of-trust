"use client";

import {
  Bell,
  CreditCard,
  Database,
  FileText,
  Gauge,
  ShieldCheck,
  TriangleAlert,
  User,
  Users,
  X,
} from "lucide-react";

const SERVICES = [
  { name: "user-service", desc: "Handles user management", icon: User },
  { name: "payment-service", desc: "Handles payment processing", icon: CreditCard },
  { name: "db-service", desc: "Manages database operations", icon: Database },
  { name: "notification-service", desc: "Sends notifications and alerts", icon: Bell },
] as const;

// Real middleware registration order, verified against proxy/index.js's
// app.all("/route/:targetService/*", verifyMiddleware, rbacMiddleware,
// lateralMovementMiddleware, contextMiddleware, rateLimitMiddleware, ...).
// Express runs middleware strictly in this order — it is the single
// source of truth for what this diagram must show.
const CHECKPOINTS = [
  { n: 1, label: "Identity Verification", icon: User },
  { n: 2, label: "RBAC (Role-Based Access Control)", icon: Users },
  { n: 3, label: "Lateral Movement Detection", icon: TriangleAlert },
  { n: 4, label: "Context Policy", icon: FileText },
  { n: 5, label: "Rate Limiting", icon: Gauge },
] as const;

export default function SystemArchitectureDiagram() {
  return (
    <div className="w-full rounded-2xl border border-white/15 bg-black p-6 sm:p-10">
      <div className="text-center">
        <h4 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          System Architecture
        </h4>
        <div className="mx-auto mt-2 h-0.5 w-14 bg-white/40" />
        <p className="mt-3 text-sm text-white/70 sm:text-base">
          All service-to-service communication flows through the Zero-Trust Proxy.
        </p>
      </div>

      {/* Service row */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {SERVICES.map((svc) => (
          <div
            key={svc.name}
            className="flex items-start gap-3 rounded-xl border border-white/25 px-3 py-3 sm:px-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/25">
              <svc.icon className="size-4 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">{svc.name}</span>
              <span className="block text-xs leading-tight text-white/60">{svc.desc}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Forwarded arrows down into the proxy */}
      <div className="mt-2 hidden grid-cols-4 gap-4 text-center text-xs text-white/50 sm:grid">
        <span />
        <span>↓ forwarded</span>
        <span>↓ forwarded</span>
        <span>↓ forwarded</span>
      </div>

      {/* Blocked direct-communication callout */}
      <div className="mx-auto mt-4 flex max-w-xs flex-col items-center gap-1 text-center sm:mx-0 sm:max-w-none sm:flex-row sm:justify-start sm:gap-3">
        <span className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
          <X className="size-3" />
          Blocked
        </span>
        <span className="text-xs text-white/50">
          Direct service-to-service communication is not allowed
        </span>
      </div>

      {/* Central proxy box */}
      <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/25 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/25">
            <ShieldCheck className="size-5 text-white" />
          </span>
          <div>
            <p className="text-lg font-bold text-white">Zero-Trust Proxy</p>
            <p className="text-xs text-white/55">Single Trust Enforcement Point</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {CHECKPOINTS.map((cp, i) => (
            <div key={cp.n} className="flex flex-col">
              <div className="flex items-center gap-3 rounded-xl border border-white/20 px-3 py-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/25">
                  <cp.icon className="size-3.5 text-white" />
                </span>
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
                  {cp.n}
                </span>
                <span className="text-sm font-medium text-white">{cp.label}</span>
              </div>
              {i < CHECKPOINTS.length - 1 && (
                <div className="my-0.5 ml-[calc(0.875rem+0.75rem)] h-2.5 border-l border-white/25" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/15 pt-5 text-xs text-white/60 sm:flex-row sm:justify-center sm:gap-8">
        <span className="flex items-center gap-2">
          <span className="h-px w-6 bg-white/60" />
          Request to Proxy
        </span>
        <span className="flex items-center gap-2">
          <span className="h-px w-6 bg-white/60" />
          Forwarded to Target Service
        </span>
        <span className="flex items-center gap-2">
          <span className="h-px w-6 border-t border-dashed border-white/60" />
          Blocked Direct Communication
        </span>
      </div>
    </div>
  );
}
