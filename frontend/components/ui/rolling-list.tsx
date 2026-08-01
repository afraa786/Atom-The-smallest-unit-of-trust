import { cn } from "@/lib/utils";
import Image from "next/image";

interface ListItem {
  id: number;
  step: string;
  title: string;
  category: string;
  desc: string;
  src: string;
  alt: string;
}

interface RollingTextItemProps {
  item: ListItem;
}

function RollingTextItem({ item }: RollingTextItemProps) {
  return (
    <div className="group relative w-full cursor-pointer border-b border-white/10 py-8">
      {/* Step label */}
      <span className="text-xs font-semibold uppercase tracking-widest text-lime-green">
        {item.step}
      </span>

      {/* Rolling text */}
      <div className="relative mt-2 h-[52px] overflow-hidden md:h-20">
        <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2">
          {/* State 1: Normal */}
          <div className="flex h-[52px] items-center md:h-20">
            <h3 className="text-4xl font-black uppercase tracking-tighter text-cool-white md:text-6xl">
              {item.title}
            </h3>
          </div>

          {/* State 2: Hover (italic + lime accent) */}
          <div className="flex h-[52px] items-center md:h-20">
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-lime-green md:text-6xl">
              {item.title}
            </h3>
          </div>
        </div>
      </div>

      <p className="mt-2 max-w-xl text-sm text-cool-white/60">{item.desc}</p>

      {/* Category label */}
      <span className="absolute right-0 top-8 hidden text-xs font-bold uppercase tracking-widest text-cool-white/40 transition-opacity duration-300 group-hover:opacity-0 md:block">
        {item.category}
      </span>

      {/* Image reveal effect */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-1/2 z-20 h-32 w-48 -translate-y-1/2 overflow-hidden rounded-lg border border-ocean-blue/40 shadow-2xl",
          "transition-all duration-500 ease-out",
          "translate-x-4 rotate-3 scale-95 opacity-0",
          "group-hover:translate-x-0 group-hover:rotate-0 group-hover:scale-100 group-hover:opacity-100"
        )}
      >
        <div className="relative h-full w-full">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="192px"
            className="object-cover grayscale transition-all duration-500 ease-out group-hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-ocean-blue/20 mix-blend-overlay" />
        </div>
      </div>
    </div>
  );
}

function RollingTextList() {
  const items: ListItem[] = [
    {
      id: 1,
      step: "Step 1",
      title: "Ingest",
      category: "Collection",
      desc: "atom pulls logs, network traffic, endpoint telemetry, and cloud events into a unified stream.",
      src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60",
      alt: "Server racks collecting telemetry",
    },
    {
      id: 2,
      step: "Step 2",
      title: "Detect",
      category: "AI Engine",
      desc: "Machine learning models flag anomalies and known attack signatures in milliseconds.",
      src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=60",
      alt: "AI model visualizing anomaly detection",
    },
    {
      id: 3,
      step: "Step 3",
      title: "Analyze",
      category: "Correlation",
      desc: "Intelligent agents correlate signals, score severity, and trace the full attack path.",
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=60",
      alt: "Analyst reviewing security data on screens",
    },
    {
      id: 4,
      step: "Step 4",
      title: "Auto-Respond",
      category: "Remediation",
      desc: "atom isolates, patches, or escalates — closing the loop before damage spreads.",
      src: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&auto=format&fit=crop&q=60",
      alt: "Automated system responding to a threat",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-stretch justify-center">
      <div className="flex w-full flex-col">
        {items.map((item) => (
          <RollingTextItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export { RollingTextList };
