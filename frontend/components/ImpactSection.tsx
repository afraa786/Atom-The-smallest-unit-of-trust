"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export interface ImpactCard {
  title: string;
  description: string;
  image: string;
}

interface ImpactSectionProps {
  cards: ImpactCard[];
  ctaHref?: string;
  ctaLabel?: string;
}

// atom color ramp: ocean-blue -> deeper ocean-blue -> charcoal -> near-black
const CARD_STYLES = [
  { bg: "bg-ocean-blue", text: "text-black", numberStroke: "rgba(0,0,0,0.55)" },
  { bg: "bg-[#2C4A7A]", text: "text-cool-white", numberStroke: "rgba(93,251,194,0.55)" },
  { bg: "bg-charcoal-surface", text: "text-cool-white", numberStroke: "rgba(93,251,194,0.4)" },
  { bg: "bg-[#0A0A0A]", text: "text-cool-white", numberStroke: "rgba(215,232,250,0.3)" },
];

export default function ImpactSection({
  cards,
  ctaHref = "#cta",
  ctaLabel = "See how atom stacks up →",
}: ImpactSectionProps) {
  const [openCard, setOpenCard] = useState(0);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-0">
        {cards.map((card, idx) => {
          const isOpen = openCard === idx;
          const style = CARD_STYLES[idx % CARD_STYLES.length];
          const number = String(idx + 1).padStart(2, "0");
          const closedHeights = [300, 350, 400, 440];
          const targetHeight = isDesktop
            ? isOpen
              ? 460
              : closedHeights[idx % closedHeights.length]
            : isOpen
              ? 480
              : 110;

          return (
            <motion.div
              key={card.title}
              onMouseEnter={() => setOpenCard(idx)}
              onFocus={() => setOpenCard(idx)}
              onClick={() => setOpenCard(idx)}
              tabIndex={0}
              animate={{ flex: isOpen ? 4.8 : 1.5 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className={`${style.bg} ${style.text} relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] md:rounded-none md:first:rounded-l-2xl md:last:rounded-r-2xl`}
            >
              <motion.div
                animate={{ height: targetHeight }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="h-full"
              >
                {isOpen ? (
                  <div className="flex h-full flex-col p-6 sm:p-8 md:p-10">
                    <div className="max-w-[340px]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70">
                        Threat Landscape
                      </p>
                      <h3 className="mt-2 text-[22px] font-semibold leading-[1.08] sm:text-[26px] md:text-[30px]">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-[13px] leading-[1.7] opacity-85 sm:text-[14px]">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-6 grid flex-1 grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1.05fr]">
                      <p
                        className="select-none text-[56px] font-black leading-none text-transparent sm:text-[64px] md:text-[76px]"
                        style={{ WebkitTextStroke: `2px ${style.numberStroke}` }}
                        aria-hidden
                      >
                        {number}
                      </p>

                      <div className="relative h-[160px] w-full overflow-hidden rounded-xl border border-white/10 sm:h-[180px] md:h-[200px]">
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between p-5 sm:p-6 md:p-7">
                    <div />
                    <div>
                      <p
                        className="select-none text-[32px] font-black leading-none text-transparent sm:text-[36px] md:text-[42px]"
                        style={{ WebkitTextStroke: `1.5px ${style.numberStroke}` }}
                        aria-hidden
                      >
                        {number}
                      </p>
                      <p className="mt-2 max-w-[140px] text-[11px] font-semibold uppercase tracking-[0.14em] opacity-90">
                        {card.title}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <a
          href={ctaHref}
          className="glow-lime inline-flex items-center justify-center rounded-full border border-ocean-blue/40 px-8 py-3.5 text-center text-cool-white/80 transition-colors duration-300 hover:border-lime-green hover:text-cool-white"
        >
          <span className="text-[13px] font-medium leading-[1.4] sm:text-[14px]">
            {ctaLabel}
          </span>
        </a>
      </div>
    </div>
  );
}
