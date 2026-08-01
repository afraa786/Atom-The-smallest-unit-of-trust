"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

// Claude logo SVG icon
function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Anthropic Claude logo mark */}
      <path
        d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z"
        fill="#D97757"
      />
      <path
        d="M28.36 14.4h-3.12L19.2 33.6h3.12l1.44-4.08h5.52l1.44 4.08h3.12L28.36 14.4zm-3.72 12.48 1.92-5.52 1.92 5.52h-3.84z"
        fill="white"
      />
    </svg>
  );
}

// Atom / Service icon
function AtomIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="4" fill="#6EADBC" />
      <ellipse cx="24" cy="24" rx="18" ry="8" stroke="#6EADBC" strokeWidth="2" fill="none" />
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="#6EADBC"
        strokeWidth="2"
        fill="none"
        transform="rotate(60 24 24)"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="8"
        stroke="#6EADBC"
        strokeWidth="2"
        fill="none"
        transform="rotate(120 24 24)"
      />
    </svg>
  );
}

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        className={cn(
          "z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-white/[0.08] p-3 shadow-[0_0_24px_-6px_rgba(110,173,188,0.5)] backdrop-blur-sm",
          className
        )}
      >
        {children}
      </div>
      {label && (
        <span className="text-xs font-semibold text-cool-white/60 tracking-wide">{label}</span>
      )}
    </div>
  );
});
Circle.displayName = "Circle";

export default function MCPBeamDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const atomRef = useRef<HTMLDivElement>(null);
  const claudeRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex w-full max-w-md mx-auto items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-12 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(110,173,188,0.08),transparent_70%)]" />

      <Circle ref={atomRef} label="Atom Proxy">
        <AtomIcon className="h-8 w-8" />
      </Circle>

      <Circle ref={claudeRef} label="Claude (MCP)">
        <ClaudeIcon className="h-8 w-8" />
      </Circle>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={atomRef}
        toRef={claudeRef}
        startYOffset={8}
        endYOffset={8}
        curvature={-18}
        gradientStartColor="#6EADBC"
        gradientStopColor="#1B5E20"
        dotted
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={atomRef}
        toRef={claudeRef}
        startYOffset={-8}
        endYOffset={-8}
        curvature={18}
        reverse
        gradientStartColor="#D97757"
        gradientStopColor="#CC9B7A"
        dotted
      />
    </div>
  );
}
