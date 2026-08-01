"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function CTAFooter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <>
      <section id="cta" className="relative bg-black py-28">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-3xl px-1 text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
            Secure your systems with{" "}
            <span className="text-lime-green text-glow-lime">atomic</span>{" "}
            precision.
          </h2>
          <p className="mt-5 text-lg text-cool-white/70">
            Get early access to atom and put a verified checkpoint in front
            of every service-to-service request in your mesh.
          </p>

          {submitted ? (
            <p className="mt-8 text-lime-green font-semibold">
              You&apos;re on the list — we&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full flex-1 rounded-full border border-white/15 bg-charcoal-surface px-5 py-3 text-sm text-cool-white placeholder:text-cool-white/40 focus:border-lime-green focus:outline-none"
              />
              <button
                type="submit"
                className="glow-lime shrink-0 rounded-full bg-ocean-blue px-7 py-3 text-sm font-bold text-cool-white transition-transform hover:-translate-y-0.5"
              >
                Get Early Access
              </button>
            </form>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-white/10 bg-black py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="text-sm font-bold text-cool-white">
            atom<span className="text-lime-green">.</span>
          </span>
          <div className="flex gap-6 text-sm text-cool-white/60">
            <a href="#product" className="hover:text-lime-green">
              Product
            </a>
            <a href="#features" className="hover:text-lime-green">
              Features
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime-green"
            >
              GitHub
            </a>
          </div>
          <span className="text-xs text-cool-white/40">
            © 2026 atom. Built for a hackathon.
          </span>
        </div>
      </footer>
    </>
  );
}
