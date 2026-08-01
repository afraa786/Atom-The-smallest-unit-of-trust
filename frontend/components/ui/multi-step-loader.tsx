"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, CircleDashed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "running" | "pass" | "fail" | "skip";

export interface LoaderStep {
  label: string;
  status: StepStatus;
  reason?: string | null;
}

interface MultiStepLoaderProps {
  steps: LoaderStep[];
  /** ms delay between each step becoming visible */
  stepDelay?: number;
  className?: string;
}

export function MultiStepLoader({
  steps,
  stepDelay = 520,
  className,
}: MultiStepLoaderProps) {
  const [visible, setVisible] = React.useState(0);

  // Each time the steps array identity changes (new request), reset
  React.useEffect(() => {
    setVisible(0);
    let current = 0;
    const tick = () => {
      current += 1;
      setVisible(current);
      if (current < steps.length) {
        id = window.setTimeout(tick, stepDelay);
      }
    };
    let id = window.setTimeout(tick, stepDelay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, stepDelay, steps.map((s) => s.status).join(",")]);

  return (
    <div className={cn("grid gap-3", className)}>
      {steps.map((step, i) => {
        const shown = i < visible;
        const isRunning = i === visible - 1 && step.status === "running";

        return (
          <AnimatePresence key={i} mode="wait">
            {shown && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3"
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0">
                  {isRunning || step.status === "running" ? (
                    <Loader2 className="size-4 animate-spin text-ocean-blue" />
                  ) : step.status === "pass" ? (
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <CheckCircle2 className="size-4 text-lime-green fill-lime-green/25" />
                    </motion.div>
                  ) : step.status === "fail" ? (
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <XCircle className="size-4 text-black fill-red-400" />
                    </motion.div>
                  ) : (
                    <CircleDashed className="size-4 text-cool-white/30" />
                  )}
                </div>

                {/* Text */}
                <div>
                  <span
                    className={cn(
                      "text-sm",
                      step.status === "pass" && "text-cool-white",
                      step.status === "fail" && "text-red-300 font-medium",
                      step.status === "skip" && "text-cool-white/40",
                      step.status === "running" && "text-ocean-blue/80",
                      step.status === "pending" && "text-cool-white/40"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.status === "fail" && step.reason && (
                    <p className="mt-0.5 text-xs text-red-400/75">{step.reason}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
