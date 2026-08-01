"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  IconSatellite,
  IconDna2,
  IconRobot,
  IconChartBar,
  IconShieldSearch,
  IconDeviceDesktopBolt,
  type Icon,
} from "@tabler/icons-react";

interface GridItem {
  title: string;
  icon: Icon;
  desc: string;
  badge?: string;
}

const items: GridItem[] = [
  {
    title: "Real-time Threat Detection",
    icon: IconSatellite,
    desc: "Continuous monitoring across endpoints, network, and cloud with sub-second alerting.",
  },
  {
    title: "AI Anomaly Engine",
    icon: IconDna2,
    desc: "Deep learning models baseline normal behavior and flag deviations before they escalate.",
  },
  {
    title: "Automated Incident Response",
    icon: IconRobot,
    desc: "Pre-approved playbooks isolate, quarantine, and remediate threats without waiting on a human.",
  },
  {
    title: "Behavioral Analysis",
    icon: IconChartBar,
    desc: "User and entity behavior analytics catch insider threats and compromised credentials.",
  },
  {
    title: "Zero-Day Pattern Recognition",
    icon: IconShieldSearch,
    badge: "New",
    desc: "Pattern-matching agents detect novel exploits with no prior signature required.",
  },
  {
    title: "Unified Security Dashboard",
    icon: IconDeviceDesktopBolt,
    desc: "One live view of every threat, agent action, and system health metric across your stack.",
  },
];

export default function DarkGrid() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ title, icon: Icon, desc, badge }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
        >
          <Card className="group relative overflow-visible border-ocean-blue/40 bg-gradient-to-b from-charcoal-surface to-black/40 p-0 transition-colors duration-300 hover:border-lime-green">
            {/* subtle gradient on hover */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-lime-green/10 via-lime-green/5 to-transparent" />
            </div>

            {/* faint inner glow that appears on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-lime-green/0 to-lime-green/0 transition-colors group-hover:from-lime-green/[0.03] group-hover:to-lime-green/[0.06]" />

            {/* lime corner squares on hover */}
            <div className="pointer-events-none absolute inset-0 hidden group-hover:block">
              <div className="absolute -left-2 -top-2 h-3 w-3 bg-lime-green" />
              <div className="absolute -right-2 -top-2 h-3 w-3 bg-lime-green" />
              <div className="absolute -left-2 -bottom-2 h-3 w-3 bg-lime-green" />
              <div className="absolute -right-2 -bottom-2 h-3 w-3 bg-lime-green" />
            </div>

            <CardHeader className="relative z-10 flex flex-row items-start gap-3 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ocean-blue/50 bg-ocean-blue/10 text-lime-green">
                <Icon className="h-5 w-5" stroke={1.75} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-medium text-cool-white">
                    {title}
                  </CardTitle>
                  {badge && (
                    <span className="rounded-full border border-lime-green/50 px-2 py-0.5 text-[10px] leading-none text-lime-green">
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 px-6 pb-6 text-sm text-cool-white/60">
              {desc}
            </CardContent>

            {/* focus ring accent on hover */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-lime-green/0"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
