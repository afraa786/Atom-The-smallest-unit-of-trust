"use client";

import React, { useEffect, useRef } from "react";

// atom brand palette — mapped from the original component's greyscale
// ramp onto our cool-white / lime-green / ocean-blue system.
const colors = {
  coolWhite: "#D7E8FA",
  coolWhiteDim: "#9FB6CC",
  limeGreen: "#1B5E20",
  oceanBlue: "#6EADBC",
};

export function Component() {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate words
    const words = document.querySelectorAll<HTMLElement>(".word");
    words.forEach((word) => {
      const delay = parseInt(word.getAttribute("data-delay") || "0", 10);
      setTimeout(() => {
        word.style.animation = "word-appear 0.8s ease-out forwards";
      }, delay);
    });

    // Mouse gradient
    const gradient = gradientRef.current;
    function onMouseMove(e: MouseEvent) {
      if (gradient) {
        gradient.style.left = e.clientX - 192 + "px";
        gradient.style.top = e.clientY - 192 + "px";
        gradient.style.opacity = "1";
      }
    }
    function onMouseLeave() {
      if (gradient) gradient.style.opacity = "0";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    // Word hover effects
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
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      id="top"
      className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-cool-white"
    >
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
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

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-1 py-28 md:px-2 md:py-32">
        {/* Top tagline */}
        <div className="text-center">
          <h2
            className="text-xs font-sans font-light uppercase tracking-[0.2em] opacity-80 md:text-sm"
            style={{ color: colors.limeGreen }}
          >
            <span className="word" data-delay="0">Welcome</span>
            <span className="word" data-delay="200">to</span>
            <span className="word" data-delay="400"><b>atom</b></span>
            <span className="word" data-delay="600">—</span>
            <span className="word" data-delay="800">the</span>
            <span className="word" data-delay="1000">atomic</span>
            <span className="word" data-delay="1200">core</span>
            <span className="word" data-delay="1400">of intelligent security.</span>
          </h2>
          <div
            className="mx-auto mt-4 h-px w-16 opacity-30"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.limeGreen}, transparent)`,
            }}
          />
        </div>

        {/* Main headline */}
        <div className="relative mx-auto max-w-5xl text-center">
          <h1
            className="text-3xl font-extralight leading-tight tracking-tight md:text-5xl lg:text-6xl"
            style={{ color: colors.coolWhite }}
          >
            <div className="mb-4 md:mb-6">
              <span className="word" data-delay="1600">Autonomous</span>
              <span className="word" data-delay="1750">defense,</span>
              <span className="word" data-delay="1900">powered</span>
              <span className="word" data-delay="2050">by</span>
              <span className="word" data-delay="2200">AI-driven</span>
              <span className="word" data-delay="2350">agents.</span>
            </div>
            <div
              className="text-2xl font-thin leading-relaxed md:text-3xl lg:text-4xl"
              style={{ color: colors.limeGreen }}
            >
              <span className="word" data-delay="2600">Ingest,</span>
              <span className="word" data-delay="2750">detect,</span>
              <span className="word" data-delay="2900">analyze,</span>
              <span className="word" data-delay="3050">and</span>
              <span className="word" data-delay="3200">respond</span>
              <span className="word" data-delay="3350">— all</span>
              <span className="word" data-delay="3500">in</span>
              <span className="word" data-delay="3650">real</span>
              <span className="word" data-delay="3800">time.</span>
            </div>
          </h1>
          <div
            className="absolute -left-8 top-1/2 h-px w-4 opacity-20"
            style={{
              background: colors.oceanBlue,
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.5s",
            }}
          />
          <div
            className="absolute -right-8 top-1/2 h-px w-4 opacity-20"
            style={{
              background: colors.oceanBlue,
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "3.7s",
            }}
          />
        </div>

        {/* CTAs */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 opacity-0"
          style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "4.2s" }}
        >
          <a
            href="#cta"
            className="glow-lime rounded-full border border-transparent bg-ocean-blue px-8 py-3.5 text-sm font-bold text-cool-white transition-transform hover:-translate-y-0.5"
          >
            Request Demo
          </a>
          <a
            href="#how-it-works"
            className="glow-lime rounded-full border border-cool-white/20 px-8 py-3.5 text-sm font-bold text-cool-white transition-transform hover:-translate-y-0.5"
          >
            See How It Works
          </a>
        </div>

        {/* Bottom tagline */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-px w-16 opacity-30"
            style={{
              background: `linear-gradient(to right, transparent, ${colors.limeGreen}, transparent)`,
            }}
          />
          <h2
            className="text-xs font-sans font-light uppercase tracking-[0.2em] opacity-80 md:text-sm"
            style={{ color: colors.limeGreen }}
          >
            <span className="word" data-delay="4400">Real-time</span>
            <span className="word" data-delay="4550">detection,</span>
            <span className="word" data-delay="4700">automated</span>
            <span className="word" data-delay="4850">response,</span>
            <span className="word" data-delay="5000">zero-day</span>
            <span className="word" data-delay="5150">awareness.</span>
          </h2>
          <div
            className="mt-6 flex justify-center space-x-4 opacity-0"
            style={{ animation: "word-appear 1s ease-out forwards", animationDelay: "4.5s" }}
          >
            <div className="h-1 w-1 rounded-full opacity-40" style={{ background: colors.limeGreen }} />
            <div className="h-1 w-1 rounded-full opacity-60" style={{ background: colors.limeGreen }} />
            <div className="h-1 w-1 rounded-full opacity-40" style={{ background: colors.limeGreen }} />
          </div>
        </div>
      </div>

      <div
        id="mouse-gradient"
        ref={gradientRef}
        className="pointer-events-none fixed h-96 w-96 rounded-full opacity-0 blur-3xl transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, rgba(110,173,188,0.22) 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
