"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Database,
  KeyRound,
  Network,
  Play,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const serviceOptions = ["user", "payment", "databases"];

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
    description: "Generate and inspect the scoped access token.",
    icon: KeyRound,
  },
  {
    id: 3,
    title: "Request Section",
    description: "Send the simulated service request.",
    icon: Send,
  },
  {
    id: 4,
    title: "Result Panel",
    description: "Response details will appear here.",
    icon: Database,
  },
];

export default function HowItWorks() {
  const [openSteps, setOpenSteps] = React.useState<number[]>([1]);
  const [sourceService, setSourceService] = React.useState(serviceOptions[0]);
  const [targetService, setTargetService] = React.useState(serviceOptions[1]);

  const toggleStep = (stepId: number) => {
    setOpenSteps((current) =>
      current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId]
    );
  };

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-black py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(110,173,188,0.12),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
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
            A simple request flow from service intent to verification result.
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
                className="overflow-hidden rounded-[28px] border border-white/[0.12] bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
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
                        <RequestSimulator
                          sourceService={sourceService}
                          targetService={targetService}
                          onSourceChange={setSourceService}
                          onTargetChange={setTargetService}
                        />
                      )}
                      {step.id === 2 && <TokenSelection />}
                      {step.id === 3 && <RequestSection />}
                      {step.id === 4 && <ResultPanel />}
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
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-cool-white/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/15 bg-black/45 px-4 text-sm font-medium text-cool-white outline-none transition-colors hover:border-white/25 focus:border-ocean-blue"
      >
        {serviceOptions.map((option) => (
          <option key={option} value={option} className="bg-black text-cool-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TokenSelection() {
  return (
    <div className="grid gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-cool-white">Token readiness</span>
          <span className="text-ocean-blue">64%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[64%] rounded-full bg-ocean-blue shadow-[0_0_22px_rgba(110,173,188,0.55)]" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <TokenNestedStep index={1} title="Generate token">
          <Button size="sm" className="mt-3 gap-2">
            <Play className="size-4" />
            Generate Token
          </Button>
        </TokenNestedStep>
        <TokenNestedStep index={2} title="Token expiry countdown">
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xl text-cool-white">
            04:59
          </div>
        </TokenNestedStep>
        <TokenNestedStep index={3} title="Optional masked preview">
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-sm text-cool-white/75">
            atk_••••_7f29
          </div>
        </TokenNestedStep>
      </div>
    </div>
  );
}

type TokenNestedStepProps = {
  index: number;
  title: string;
  children: React.ReactNode;
};

function TokenNestedStep({ index, title, children }: TokenNestedStepProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-ocean-blue text-xs font-bold text-black">
          {index}
        </span>
        <span className="text-sm font-semibold text-cool-white">{title}</span>
      </div>
      {children}
    </div>
  );
}

function RequestSection() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-cool-white">Ready to request</h3>
        <p className="mt-1 text-sm text-cool-white/60">
          Submit the selected service-to-service request for verification.
        </p>
      </div>
      <Button className="gap-2">
        <Send className="size-4" />
        Request
      </Button>
    </div>
  );
}

function ResultPanel() {
  return (
    <div
      className="min-h-40 rounded-3xl border border-dashed border-white/[0.14] bg-black/25"
      aria-label="Empty result panel"
    />
  );
}
