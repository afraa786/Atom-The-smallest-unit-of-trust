"use client";

import * as React from "react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:4000";
const POLL_INTERVAL_MS = 4000;
const MAX_POINTS = 30;

type MetricKey = "avgLatency" | "p95Latency" | "totalRequests" | "securityAlerts";

type Sample = {
  time: string;
  avgLatency: number;
  p95Latency: number;
  totalRequests: number;
  securityAlerts: number;
};

const chartConfig: ChartConfig = {
  avgLatency: { label: "Avg Latency", color: "#6EADBC" },
  p95Latency: { label: "P95 Latency", color: "#1B5E20" },
  totalRequests: { label: "Total Requests", color: "#D7E8FA" },
  securityAlerts: { label: "Security Alerts", color: "#EF4444" },
};

const metricMeta: Record<
  MetricKey,
  { label: string; format: (v: number) => string }
> = {
  avgLatency: { label: "Avg Latency", format: (v) => `${v.toFixed(2)}ms` },
  p95Latency: { label: "P95 Latency", format: (v) => `${v.toFixed(2)}ms` },
  totalRequests: { label: "Total Requests", format: (v) => v.toLocaleString() },
  securityAlerts: { label: "Security Alerts", format: (v) => v.toLocaleString() },
};

async function fetchSample(): Promise<Sample | null> {
  try {
    const [metricsRes, logsRes, alertsRes] = await Promise.all([
      fetch(`${PROXY_URL}/metrics`),
      fetch(`${PROXY_URL}/logs`),
      fetch(`${PROXY_URL}/alerts`),
    ]);

    if (!metricsRes.ok || !logsRes.ok || !alertsRes.ok) return null;

    const metrics = await metricsRes.json();
    const { logs } = await logsRes.json();
    const { alerts } = await alertsRes.json();

    return {
      time: new Date().toLocaleTimeString("en-US", {
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
      }),
      avgLatency: metrics.avgMs ?? 0,
      p95Latency: metrics.p95Ms ?? 0,
      totalRequests: logs?.length ?? 0,
      securityAlerts: alerts?.length ?? 0,
    };
  } catch {
    return null;
  }
}

export default function LiveMetricsChart() {
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>("avgLatency");
  const [samples, setSamples] = React.useState<Sample[]>([]);
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function poll() {
      const sample = await fetchSample();
      if (cancelled) return;

      if (!sample) {
        setConnected(false);
        return;
      }

      setConnected(true);
      setSamples((prev) => {
        const next = [...prev, sample];
        return next.length > MAX_POINTS ? next.slice(next.length - MAX_POINTS) : next;
      });
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const latest = samples[samples.length - 1];
  const previous = samples[samples.length - 2];

  return (
    <section id="live-checkpoint-metrics" className="relative bg-black pb-20 pt-16 sm:pt-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-0">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            Live checkpoint <span className="text-lime-green">metrics</span>
          </h2>
          <p className="mt-4 text-cool-white/70">
            Real numbers, polled directly from the running proxy&apos;s{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
              /metrics
            </code>
            ,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
              /logs
            </code>
            , and{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
              /alerts
            </code>{" "}
            endpoints every {POLL_INTERVAL_MS / 1000}s.
          </p>
        </div>

        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-charcoal-surface">
          {/* Metric selector tiles */}
          <div className="grid grid-cols-2 divide-y divide-white/10 border-b border-white/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {(Object.keys(metricMeta) as MetricKey[]).map((key) => {
              const meta = metricMeta[key];
              const value = latest ? latest[key] : 0;
              const prevValue = previous ? previous[key] : value;
              const delta = value - prevValue;
              const isUp = delta > 0;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  className={cn(
                    "flex-1 p-5 text-left transition-colors hover:bg-white/[0.04]",
                    selectedMetric === key && "bg-white/[0.06]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-cool-white/60">
                      {meta.label}
                    </span>
                    {previous && delta !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                          isUp ? "text-lime-green" : "text-cool-white/50"
                        )}
                      >
                        {isUp ? (
                          <ArrowUp className="size-2.5" />
                        ) : (
                          <ArrowDown className="size-2.5" />
                        )}
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-2 text-2xl font-bold"
                    style={{ color: chartConfig[key].color }}
                  >
                    {latest ? meta.format(value) : "—"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div className="px-3 py-6">
            {samples.length < 2 ? (
              <div className="flex h-64 items-center justify-center text-sm text-cool-white/40">
                {connected === false
                  ? "Can't reach the proxy — start it at " + PROXY_URL
                  : "Collecting live samples..."}
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <LineChart
                  data={samples}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "rgba(215,232,250,0.5)" }}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "rgba(215,232,250,0.5)" }}
                    tickMargin={10}
                    width={48}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={chartConfig[selectedMetric].color}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                    activeDot={{
                      r: 5,
                      fill: chartConfig[selectedMetric].color,
                      stroke: "#000",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
