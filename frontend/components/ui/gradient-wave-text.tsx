"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientWaveTextProps {
  children: string;
  className?: string;
  /** Duration of a full wave cycle in seconds */
  duration?: number;
  colors?: string[];
}

export function GradientWaveText({
  children,
  className,
  duration = 2.2,
  colors = ["#6EADBC", "#a8edcb", "#d7e8fa", "#6EADBC"],
}: GradientWaveTextProps) {
  const letters = Array.from(children);

  return (
    <span className={cn("inline-flex flex-wrap justify-center", className)} aria-label={children}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          animate={{
            color: colors,
          }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: (i / letters.length) * duration * 0.6,
          }}
          style={{ display: char === " " ? "inline" : "inline-block", whiteSpace: "pre" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
