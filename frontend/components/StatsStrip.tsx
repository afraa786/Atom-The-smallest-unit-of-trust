"use client";

import { motion } from "framer-motion";
import ImpactSection from "@/components/ImpactSection";

const STATS = [
  {
    title: "2,200+ attacks a day",
    description: "Cyberattacks occur every day worldwide, and the rate keeps climbing.",
    image: "/stats/1.jpg",
  },
  {
    title: "$4.9M per breach",
    description: "Average cost of a data breach in 2025 — a single incident can define a year.",
    image: "/stats/2.jpg",
  },
  {
    title: "277 days to detect",
    description: "Average time to identify a breach manually, without automated defense.",
    image: "/stats/3.jpg",
  },
  {
    title: "94% involve delay",
    description: "Of breaches involve a human or process delay atom is built to eliminate.",
    image: "/stats/4.jpg",
  },
];

export default function StatsStrip() {
  return (
    <section className="relative bg-black py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-0">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-cool-white/50"
        >
          The threat landscape isn&apos;t waiting
        </motion.p>

        <ImpactSection cards={STATS} />
      </div>
    </section>
  );
}
