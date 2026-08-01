"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const SECTIONS = [
  {
    heading: "WHAT YOU'RE LOOKING AT",
    body: "This is not a mockup or a simulated demo — every dropdown selection above triggers real HTTP calls to a live Zero-Trust proxy running in Docker. When you select a source and target service and click through the steps, the page requests a real cryptographically-signed JWT from the proxy's /auth/token endpoint, sends it through the real enforcement pipeline at /route/:target/data, and displays the actual HTTP status code and decision the proxy returned. Nothing shown here is hardcoded or pre-recorded.",
  },
  {
    heading: "HOW TO READ THE RESULT PANEL",
    body: "Each checkpoint shown in the result panel corresponds to a real, independent verification stage inside the proxy. A green check means that specific stage passed for this exact request; a red X shows the precise reason it failed, pulled directly from the proxy's own request log. Try selecting user-service as source and db-service as target to see a real RBAC rejection, or select any pairing repeatedly to see live latency numbers change with each request.",
  },
  {
    heading: "THE FULL ATTACK SIMULATION",
    body: "Beyond this manual flow, the system includes a standalone attack simulation script (simulate-attack.js) that exercises the entire mesh end-to-end in six stages: baseline legitimate traffic, an unauthorized lateral access attempt blocked by RBAC, a rapid fan-out pattern that triggers behavioral lateral-movement detection, a flood of requests that triggers rate limiting, a simulated request from a disallowed region that triggers forced re-authentication, and a final summary pulling real numbers from the proxy's /metrics and /alerts endpoints. This script is what was used to validate the system end-to-end and is available in the project repository.",
  },
  {
    heading: "VERIFIED PERFORMANCE",
    body: "Across 100 sequential requests benchmarked directly against the live proxy, average checkpoint-only latency (identity verification, RBAC, context checks, rate limiting, and lateral-movement detection combined) measured 1.58ms in the Dockerized deployment, with a 95th-percentile of 2.3ms — well within the 15ms target for real-time service mesh enforcement.",
  },
];

export default function WhatYoureLookingAt() {
  return (
    <section id="docs" className="relative bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-3 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mb-20 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:mb-28 sm:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(110,173,188,0.16),transparent_34%)]" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ocean-blue">
                System Architecture
              </p>
              <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-cool-white sm:text-4xl">
                Zero-trust request path
              </h3>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cool-white/70">
                The architecture diagram now lives with the documentation so it
                can support the explanation below without competing with the
                first-viewport hero.
              </p>
            </div>
            <div className="relative mx-auto flex w-full max-w-xl items-center justify-center">
              <div className="absolute h-80 w-80 rounded-full bg-ocean-blue/20 blur-3xl md:h-[30rem] md:w-[30rem]" />
              <Image
                src="/3d.png"
                alt="Zero-trust system architecture diagram"
                width={680}
                height={680}
                className="relative w-full max-w-md drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] lg:max-w-lg"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-20 sm:gap-28">
          {SECTIONS.map((item, i) => (
            <motion.div
              key={item.heading}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="text-left"
            >
              <h3 className="text-3xl font-black uppercase tracking-tight text-cool-white sm:text-4xl">
                {item.heading}
              </h3>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-cool-white/70 sm:text-lg">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
