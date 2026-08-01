// hero-section.tsx
"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import heroBackground from "@/assets/hero_section_bg.jpg";

// atom brand palette — mapped from the original component's greyscale
// ramp onto our cool-white / lime-green / ocean-blue system.
const colors = {
  coolWhite: "#D7E8FA",
  coolWhiteDim: "#9FB6CC",
  limeGreen: "#1B5E20",
  oceanBlue: "#6EADBC",
};

export function Component() {
  useEffect(() => {
    // Word hover effects — the reveal animation itself is set inline via
    // style on each span (CSS-driven, fires reliably on mount), this only
    // adds the interactive glow-on-hover behavior on top.
    const words = document.querySelectorAll<HTMLElement>(".word");
    words.forEach((word) => {
      word.addEventListener("mouseenter", () => {
        word.style.textShadow = "0 0 20px rgba(27, 94, 32, 0.8)";
      });
      word.addEventListener("mouseleave", () => {
        word.style.textShadow = "none";
      });
    });

    // Click ripple effect
    function onClick(e: MouseEvent) {
      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      ripple.style.width = "4px";
      ripple.style.height = "4px";
      ripple.style.background = "rgba(27, 94, 32, 0.85)";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.pointerEvents = "none";
      ripple.style.animation = "pulse-glow 1s ease-out forwards";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);
    }
    document.addEventListener("click", onClick);

    // Floating elements on scroll
    let scrolled = false;
    function onScroll() {
      if (!scrolled) {
        scrolled = true;
        document
          .querySelectorAll<HTMLElement>(".floating-element")
          .forEach((el, index) => {
            setTimeout(() => {
              el.style.animationPlayState = "running";
            }, index * 200);
          });
      }
    }
    window.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      id="top"
      className="relative w-full overflow-hidden font-sans text-cool-white"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src={heroBackground}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(110,173,188,0.16),transparent_36%),linear-gradient(180deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.42)_48%,#000_100%)]" />
      </div>

      <svg className="absolute inset-0 -z-10 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(215,232,250,0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="0" y1="20%" x2="100%" y2="20%" className="grid-line" style={{ animationDelay: "0.5s" }} />
        <line x1="0" y1="80%" x2="100%" y2="80%" className="grid-line" style={{ animationDelay: "1s" }} />
        <line x1="20%" y1="0" x2="20%" y2="100%" className="grid-line" style={{ animationDelay: "1.5s" }} />
        <line x1="80%" y1="0" x2="80%" y2="100%" className="grid-line" style={{ animationDelay: "2s" }} />
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: "2.5s", opacity: 0.05 }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          className="grid-line"
          style={{ animationDelay: "3s", opacity: 0.05 }}
        />
        <circle cx="20%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3s" }} />
        <circle cx="80%" cy="20%" r="2" className="detail-dot" style={{ animationDelay: "3.2s" }} />
        <circle cx="20%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.4s" }} />
        <circle cx="80%" cy="80%" r="2" className="detail-dot" style={{ animationDelay: "3.6s" }} />
        <circle cx="50%" cy="50%" r="1.5" className="detail-dot" style={{ animationDelay: "4s" }} />
      </svg>

      {/* Corner elements */}
      <div className="corner-element left-8 top-8" style={{ animationDelay: "4s" }}>
        <div
          className="absolute left-0 top-0 h-2 w-2 opacity-30"
          style={{ background: colors.limeGreen }}
        />
      </div>
      <div className="corner-element right-8 top-8" style={{ animationDelay: "4.2s" }}>
        <div
          className="absolute right-0 top-0 h-2 w-2 opacity-30"
          style={{ background: colors.limeGreen }}
        />
      </div>
      <div className="corner-element bottom-8 left-8" style={{ animationDelay: "4.4s" }}>
        <div
          className="absolute bottom-0 left-0 h-2 w-2 opacity-30"
          style={{ background: colors.limeGreen }}
        />
      </div>
      <div className="corner-element bottom-8 right-8" style={{ animationDelay: "4.6s" }}>
        <div
          className="absolute bottom-0 right-0 h-2 w-2 opacity-30"
          style={{ background: colors.limeGreen }}
        />
      </div>

      {/* Floating elements */}
      <div className="floating-element" style={{ top: "25%", left: "15%", animationDelay: "5s" }} />
      <div className="floating-element" style={{ top: "60%", left: "85%", animationDelay: "5.5s" }} />
      <div className="floating-element" style={{ top: "40%", left: "10%", animationDelay: "6s" }} />
      <div className="floating-element" style={{ top: "75%", left: "90%", animationDelay: "6.5s" }} />

      <div className="relative z-10 flex w-full items-center px-3 pb-2 pt-28 sm:px-0 md:pb-3 md:pt-32">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left column: text content */}
          <div className="max-w-3xl text-left">
            <div className="relative">
              <h1
                className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl [&_.word]:mr-[0.08em]"
                style={{ color: colors.coolWhite }}
              >
                {[
                  ["Stop", 0],
                  ["Attackers", 150],
                  ["at", 300],
                  ["the", 450],
                  ["First", 600],
                  ["Request.", 750],
                ].map(([text, delayMs]) => (
                  <span
                    key={text}
                    className="word"
                    style={{
                      animation: "word-appear 0.8s ease-out forwards",
                      animationDelay: `${delayMs}ms`,
                    }}
                  >
                    {text}
                  </span>
                ))}
              </h1>
            </div>

            {/* Subhead */}
            <p
              className="mt-6 max-w-xl text-left text-base font-light leading-relaxed opacity-0 md:text-lg"
              style={{
                color: colors.coolWhiteDim,
                animation: "word-appear 1s ease-out forwards",
                animationDelay: "1.5s",
              }}
            >
              Atom is a real-time Zero-Trust
              platform that secures decentralized APIs with authentication & continuous verification.
            </p>

            {/* CTAs */}
            <div
              className="mt-10 flex flex-wrap items-center justify-start gap-4 opacity-0"
              style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "1.9s" }}
            >
              <a
                href="#cta"
                className="glass-specular rounded-full border border-white/25 bg-cool-white/85 px-8 py-3.5 text-sm font-bold text-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_28px_rgba(110,173,188,0.26)] transition-colors hover:bg-cool-white"
              >
                Request Demo
              </a>
              <a
                href="#how-it-works"
                className="glass-specular rounded-full border border-white/20 bg-white/[0.08] px-8 py-3.5 text-sm font-bold text-cool-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:bg-white/[0.14]"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-xl opacity-0 lg:max-w-none"
            style={{ animation: "word-appear 1.2s ease-out forwards", animationDelay: "0.6s" }}
          >
            <div className="absolute -inset-8 rounded-full bg-ocean-blue/20 blur-3xl" />
            <div className="glass-panel relative overflow-hidden rounded-[28px] p-2">
              <video
                src="/assets/hero_video.mp4"
                className="aspect-video w-full rounded-[22px] object-cover"
                autoPlay
                controls
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
