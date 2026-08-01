"use client";

import { motion } from "framer-motion";
import { RollingTextList } from "@/components/ui/rolling-list";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-black py-28">
      <div className="mx-auto max-w-7xl px-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            How <span className="text-lime-green">atom</span> works
          </h2>
          <p className="mt-4 text-cool-white/70">
            A continuous, autonomous loop — from raw signal to resolved threat.
          </p>
        </motion.div>

        <RollingTextList />
      </div>
    </section>
  );
}
