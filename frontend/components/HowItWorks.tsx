"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Database,
  KeyRound,
  Loader2,
  Network,
  Play,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:4000";

const serviceOptions = [
  "user-service",
  "payment-service",
  "db-service",
  "notification-service",
];

const steps = [
  {
    id: 1,
    title: "Request Simulator",
    description: "Choose the source and destination services.",
    icon: Network,
  },
  {
    id: 2,
    title: "Token Selection",
    description: "Generate and inspect a real, live-issued access token.",
    icon: KeyRound,
  },
  {
    id: 3,
    title: "Request Section",
    description: "Send the request through the live proxy.",
    icon: Send,
  },
  {
    id: 4,
    title: "Result Panel",
    description: "Real checkpoint-by-checkpoint outcome.",
    icon: Database,
  },
];

// --- JWT decode (display only — no verification happens client-side) ---
type DecodedToken = {
  service?: string;
  iat?: number;
  jti?: string;
  exp?: number;
};

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded.padEnd(
    padded.length + ((4 - (padded.length % 4)) % 4),
    "="
  );
  if (typeof window === "undefined") return "";
  return decodeURIComponent(
    atob(withPadding)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

// --- Shared live-demo state, lifted so steps 2-4 can all react to it ---

type LogEntry = {
  timestamp: string;
  caller: string;
  target: string;
  decision:
    | "allowed"
    | "blocked_identity"
    | "blocked_rbac"
    | "reauth_required"
    | "blocked_rate_limit";
  reason: string | null;
  securityAlert: string | null;
  latencyMs: number;
};

type RequestResult = {
  status: number;
  body: unknown;
};

export default function HowItWorks() {
  const [openSteps, setOpenSteps] = React.useState<number[]>([1]);
  const stepCardRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [sourceService, setSourceService] = React.useState(serviceOptions[0]);
  const [targetService, setTargetService] = React.useState(serviceOptions[1]);

  const [token, setToken] = React.useState<string | null>(null);
  const [decoded, setDecoded] = React.useState<DecodedToken | null>(null);
  const [tokenLoading, setTokenLoading] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  const [requestResult, setRequestResult] = React.useState<RequestResult | null>(null);
  const [requestLoading, setRequestLoading] = React.useState(false);
  const [requestError, setRequestError] = React.useState<string | null>(null);

  const [logEntry, setLogEntry] = React.useState<LogEntry | null>(null);
  const [resultLoading, setResultLoading] = React.useState(false);
  const [resultError, setResultError] = React.useState<string | null>(null);

  const toggleStep = (stepId: number) => {
    setOpenSteps((current) =>
      current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId]
    );
  };

  const handleNextStep = (currentStepId: number) => {
    const nextStepId = currentStepId + 1;

    setOpenSteps((current) =>
      current.includes(nextStepId) ? current : [...current, nextStepId]
    );

    window.setTimeout(() => {
      stepCardRefs.current[nextStepId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  };

  // Changing either service invalidates everything downstream — a new
  // token, request, and result all need to be produced fresh so the demo
  // never shows a result panel that doesn't match the currently selected pair.
  const resetDownstream = () => {
    setToken(null);
    setDecoded(null);
    setTokenError(null);
    setRequestResult(null);
    setRequestError(null);
    setLogEntry(null);
    setResultError(null);
  };

  async function handleGenerateToken() {
    setTokenLoading(true);
    setTokenError(null);
    setToken(null);
    setDecoded(null);
    // A fresh token invalidates any prior request/result for this pair.
    setRequestResult(null);
    setRequestError(null);
    setLogEntry(null);
    setResultError(null);

    try {
      const res = await fetch(`${PROXY_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: sourceService }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Token request failed (HTTP ${res.status})`);
      }

      const { token: newToken } = await res.json();
      setToken(newToken);
      setDecoded(decodeJwtPayload(newToken));
      setOpenSteps((cur) => (cur.includes(3) ? cur : [...cur, 3]));
    } catch (err) {
      setTokenError(
        err instanceof Error
          ? `Proxy unreachable or rejected the request: ${err.message}`
          : "Proxy unreachable — is it running?"
      );
    } finally {
      setTokenLoading(false);
    }
  }

  async function handleSendRequest() {
    if (!token) return;

    setRequestLoading(true);
    setRequestError(null);
    setRequestResult(null);
    setLogEntry(null);
    setResultError(null);

    try {
      const res = await fetch(
        `${PROXY_URL}/route/${targetService}/data`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await res.json().catch(() => null);
      setRequestResult({ status: res.status, body });
      setOpenSteps((cur) => (cur.includes(4) ? cur : [...cur, 4]));

      // Give the proxy's own log write a brief moment to land, then pull
      // the real entry it produced for this exact call.
      await fetchMatchingLogEntry();
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? `Proxy unreachable: ${err.message}`
          : "Proxy unreachable — is it running?"
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function fetchMatchingLogEntry() {
    setResultLoading(true);
    setResultError(null);

    try {
      const res = await fetch(
        `${PROXY_URL}/logs?service=${encodeURIComponent(sourceService)}`
      );
      if (!res.ok) {
        throw new Error(`Log lookup failed (HTTP ${res.status})`);
      }
      const { logs } = await res.json();
      const match = (logs as LogEntry[]).find(
        (entry) => entry.caller === sourceService && entry.target === targetService
      );
      setLogEntry(match ?? null);
      if (!match) {
        setResultError(
          "No matching log entry found yet — the proxy may still be writing it."
        );
      }
    } catch (err) {
      setResultError(
        err instanceof Error
          ? `Proxy unreachable: ${err.message}`
          : "Proxy unreachable — is it running?"
      );
    } finally {
      setResultLoading(false);
    }
  }

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-black py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,173,188,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-3 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            How <span className="text-forest-green">atom</span> works
          </h2>
          <p className="mt-4 text-cool-white/70">
            A live request flow — every number below comes from a real call
            to the running zero-trust-proxy.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto grid max-w-5xl gap-4"
        >
          {steps.map((step) => {
            const expanded = openSteps.includes(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                ref={(node) => {
                  stepCardRefs.current[step.id] = node;
                }}
                className="scroll-mt-28 overflow-hidden rounded-[28px] border border-white/[0.12] bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.055] sm:px-6"
                  aria-expanded={expanded}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-ocean-blue">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase text-ocean-blue">
                      Step {step.id}
                    </span>
                    <span className="mt-1 block text-xl font-bold text-cool-white">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm text-cool-white/55">
                      {step.description}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-cool-white/60 transition-transform duration-300",
                      expanded && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 px-5 py-6 sm:px-6">
                      {step.id === 1 && (
                        <>
                          <RequestSimulator
                            sourceService={sourceService}
                            targetService={targetService}
                            onSourceChange={(v) => {
                              setSourceService(v);
                              resetDownstream();
                            }}
                            onTargetChange={(v) => {
                              setTargetService(v);
                              resetDownstream();
                            }}
                          />
                          <StepNextButton onClick={() => handleNextStep(1)} />
                        </>
                      )}
                      {step.id === 2 && (
                        <>
                          <TokenSelection
                            sourceService={sourceService}
                            token={token}
                            decoded={decoded}
                            loading={tokenLoading}
                            error={tokenError}
                            onGenerate={handleGenerateToken}
                          />
                          <StepNextButton onClick={() => handleNextStep(2)} />
                        </>
                      )}
                      {step.id === 3 && (
                        <RequestSection
                          sourceService={sourceService}
                          targetService={targetService}
                          hasToken={Boolean(token)}
                          loading={requestLoading}
                          error={requestError}
                          onSend={handleSendRequest}
                        />
                      )}
                      {step.id === 4 && (
                        <ResultPanel
                          requestResult={requestResult}
                          logEntry={logEntry}
                          loading={resultLoading}
                          error={resultError}
                          onRefresh={fetchMatchingLogEntry}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function StepNextButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <Button type="button" variant="outline" className="gap-2" onClick={onClick}>
        Next
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

// --- Step 1: Request Simulator ---

type RequestSimulatorProps = {
  sourceService: string;
  targetService: string;
  onSourceChange: (value: string) => void;
  onTargetChange: (value: string) => void;
};

function RequestSimulator({
  sourceService,
  targetService,
  onSourceChange,
  onTargetChange,
}: RequestSimulatorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ServiceSelect
        label="Source service"
        value={sourceService}
        onChange={onSourceChange}
      />
      <ServiceSelect
        label="Target service"
        value={targetService}
        onChange={onTargetChange}
      />
    </div>
  );
}

type ServiceSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function ServiceSelect({ label, value, onChange }: ServiceSelectProps) {
  const id = `service-select-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {serviceOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// --- Step 2: Token Selection ---

type TokenSelectionProps = {
  sourceService: string;
  token: string | null;
  decoded: DecodedToken | null;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
};

function TokenSelection({
  sourceService,
  token,
  decoded,
  loading,
  error,
  onGenerate,
}: TokenSelectionProps) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-cool-white">
            Request a live token for{" "}
            <span className="text-ocean-blue">{sourceService}</span>
          </h3>
          <p className="mt-1 text-sm text-cool-white/60">
            Calls <code className="rounded bg-white/10 px-1.5 py-0.5">POST /auth/token</code>{" "}
            on the running proxy — a real, short-lived JWT signed with{" "}
            {sourceService}&apos;s own secret.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={loading} className="gap-2 shrink-0">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {loading ? "Requesting..." : "Generate Token"}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {token && decoded && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-cool-white/50">
              Raw token
            </span>
            <p className="mt-2 break-all font-mono text-xs text-cool-white/80">
              {token}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-cool-white/50">
              Decoded payload
            </span>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
              <dt className="text-cool-white/50">service</dt>
              <dd className="text-lime-green">{decoded.service}</dd>
              <dt className="text-cool-white/50">iat</dt>
              <dd className="text-cool-white/80">
                {decoded.iat} ({decoded.iat && new Date(decoded.iat * 1000).toLocaleTimeString()})
              </dd>
              <dt className="text-cool-white/50">exp</dt>
              <dd className="text-cool-white/80">
                {decoded.exp} ({decoded.exp && new Date(decoded.exp * 1000).toLocaleTimeString()})
              </dd>
              <dt className="text-cool-white/50">jti</dt>
              <dd className="text-cool-white/80">{decoded.jti}</dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Step 3: Request Section ---

type RequestSectionProps = {
  sourceService: string;
  targetService: string;
  hasToken: boolean;
  loading: boolean;
  error: string | null;
  onSend: () => void;
};

function RequestSection({
  sourceService,
  targetService,
  hasToken,
  loading,
  error,
  onSend,
}: RequestSectionProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-cool-white">
            {sourceService} <span className="text-cool-white/40">→</span>{" "}
            {targetService}
          </h3>
          <p className="mt-1 text-sm text-cool-white/60">
            {hasToken
              ? "Sends GET /route/" + targetService + "/data with the live token attached."
              : "Generate a token in Step 2 first."}
          </p>
        </div>
        <Button
          onClick={onSend}
          disabled={!hasToken || loading}
          className="gap-2 shrink-0"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {loading ? "Sending..." : "Send Request"}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

// --- Step 4: Result Panel ---

type ResultPanelProps = {
  requestResult: RequestResult | null;
  logEntry: LogEntry | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function ResultPanel({
  requestResult,
  logEntry,
  loading,
  error,
  onRefresh,
}: ResultPanelProps) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-2 rounded-3xl border border-white/[0.14] bg-black/25 text-sm text-cool-white/50">
        <Loader2 className="size-4 animate-spin" />
        Pulling the real checkpoint log...
      </div>
    );
  }

  if (!requestResult) {
    return (
      <div
        className="flex min-h-40 items-center justify-center rounded-3xl border border-dashed border-white/[0.14] bg-black/25 text-sm text-cool-white/40"
        aria-label="Empty result panel"
      >
        Run Step 3 to see the real result here.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={onRefresh} className="shrink-0">
            Retry
          </Button>
        </div>
      )}

      {logEntry ? (
        <CheckpointBreakdown logEntry={logEntry} requestResult={requestResult} />
      ) : (
        !error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-cool-white/50">
            Request completed with HTTP {requestResult.status}, but no matching
            log entry was found yet.
          </div>
        )
      )}

      <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-cool-white/50">
          Raw response body
        </span>
        <pre className="mt-2 overflow-x-auto font-mono text-xs text-cool-white/70">
          {JSON.stringify(requestResult.body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function CheckpointBreakdown({
  logEntry,
  requestResult,
}: {
  logEntry: LogEntry;
  requestResult: RequestResult;
}) {
  const { decision, reason, securityAlert, latencyMs, caller } = logEntry;
  const overallOk = decision === "allowed";

  // The proxy's checkpoint chain short-circuits: identity -> RBAC ->
  // context -> rate-limit, in that order, and stops at whichever one
  // blocks. A checkpoint after the blocking one never actually ran, so
  // it's shown as "not reached" rather than a false green pass.
  const order = [
    "blocked_identity",
    "blocked_rbac",
    "reauth_required",
    "blocked_rate_limit",
  ] as const;
  const blockedAtIndex = order.indexOf(decision as (typeof order)[number]);
  const reachedIndex = blockedAtIndex === -1 ? order.length : blockedAtIndex;

  const status = (index: number): "pass" | "fail" | "skip" =>
    index < reachedIndex ? "pass" : index === reachedIndex ? "fail" : "skip";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="grid gap-2.5">
        <CheckLine
          status={status(0)}
          label={
            status(0) === "fail"
              ? "Identity verification failed"
              : `Identity verified as ${caller}`
          }
          reason={status(0) === "fail" ? reason : undefined}
        />
        <CheckLine
          status={status(1)}
          label={
            status(1) === "fail"
              ? "RBAC check: denied"
              : status(1) === "skip"
                ? "RBAC check: not reached"
                : "RBAC check: allowed"
          }
          reason={status(1) === "fail" ? reason : undefined}
        />
        <CheckLine
          status={status(2)}
          label={
            status(2) === "fail"
              ? "Context checks: re-authentication required"
              : status(2) === "skip"
                ? "Context checks: not reached"
                : "Context checks: time / geo / payload — all passed"
          }
          reason={status(2) === "fail" ? reason : undefined}
        />
        <CheckLine
          status={status(3)}
          label={
            status(3) === "fail"
              ? "Rate limit exceeded"
              : status(3) === "skip"
                ? "Rate limit check: not reached"
                : "Rate limit check: within limit"
          }
          reason={status(3) === "fail" ? reason : undefined}
        />
        {securityAlert && (
          <div className="mt-1 flex items-start gap-2.5 text-sm text-yellow-300">
            <span className="mt-0.5">⚠</span>
            <span>
              Lateral-movement signal fired:{" "}
              <span className="font-semibold">{securityAlert}</span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p
          className={cn(
            "text-sm font-semibold",
            overallOk ? "text-lime-green" : "text-red-400"
          )}
        >
          Final result: HTTP {requestResult.status} in {latencyMs.toFixed(2)}ms
          {" — "}
          {decision.replace(/_/g, " ")}
        </p>
      </div>
    </div>
  );
}

function CheckLine({
  status,
  label,
  reason,
}: {
  status: "pass" | "fail" | "skip";
  label: string;
  reason?: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      {status === "pass" && (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime-green" />
      )}
      {status === "fail" && (
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
      )}
      {status === "skip" && (
        <CircleDashed className="mt-0.5 size-4 shrink-0 text-cool-white/30" />
      )}
      <div>
        <span
          className={cn(
            status === "pass" && "text-cool-white",
            status === "fail" && "text-red-300",
            status === "skip" && "text-cool-white/40"
          )}
        >
          {label}
        </span>
        {status === "fail" && reason && (
          <p className="mt-0.5 text-xs text-red-400/80">{reason}</p>
        )}
      </div>
    </div>
  );
}
