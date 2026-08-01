// "use client";

// import { motion } from "framer-motion";
// import { IconAtom2, IconTopologyStar3, IconShieldHalf } from "@tabler/icons-react";

// const POINTS = [
//   {
//     icon: IconAtom2,
//     title: "Speed beyond human limits",
//     desc: "Attacks unfold in seconds. AI agents detect and act at machine speed, not shift-change speed.",
//   },
//   {
//     icon: IconTopologyStar3,
//     title: "Pattern recognition at scale",
//     desc: "Neural networks spot the faint signal in billions of events that a human analyst would miss.",
//   },
//   {
//     icon: IconShieldHalf,
//     title: "A tireless front line",
//     desc: "atom's agents never sleep, never burn out, and get sharper with every incident they see.",
//   },
// ];

// export default function WhyAI() {
//   return (
//     <section className="relative bg-black py-28">
//       <div className="mx-auto max-w-7xl px-1">
//         <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
//           <motion.div
//             initial={{ opacity: 0, x: -24 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.7 }}
//           >
//             <h2 className="text-4xl font-bold tracking-tight text-cool-white sm:text-5xl">
//               Why <span className="text-lime-green">AI</span> +
//               cybersecurity
//             </h2>
//             <p className="mt-6 text-lg text-cool-white/70">
//               Traditional security tools react after the fact. atom fuses
//               real-time telemetry with intelligent agents that reason about
//               intent, not just signatures — turning security from a
//               rearview mirror into a live, adaptive defense system.
//             </p>
//             <p className="mt-4 text-lg text-cool-white/70">
//               The result: threats are contained in seconds, not days, and
//               your team spends time on strategy instead of alert fatigue.
//             </p>
//           </motion.div>

//           <div className="grid grid-cols-1 gap-5">
//             {POINTS.map((point, i) => (
//               <motion.div
//                 key={point.title}
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ duration: 0.5, delay: i * 0.12 }}
//                 className="glow-lime flex items-start gap-4 rounded-2xl border border-ocean-blue/50 bg-charcoal-surface p-6"
//               >
//                 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lime-green/50 bg-lime-green/10">
//                   <point.icon className="size-5 text-lime-green" stroke={1.75} />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-cool-white">
//                     {point.title}
//                   </h3>
//                   <p className="mt-1 text-sm text-cool-white/60">
//                     {point.desc}
//                   </p>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
