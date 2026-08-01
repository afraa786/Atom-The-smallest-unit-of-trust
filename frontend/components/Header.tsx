// header.tsx
"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { createPortal } from "react-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { Icon } from "@tabler/icons-react";
import {
  IconRadar,
  IconDna2,
  IconRobot,
  IconChartBar,
  IconShieldSearch,
  IconDeviceDesktopBolt,
  IconUsers,
  IconFileText,
  IconShield,
} from "@tabler/icons-react";

type LinkItem = {
  title: string;
  href: string;
  icon: Icon;
  description?: string;
};

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-5">
      <nav
        className={cn(
          "glass-nav relative flex h-16 w-full max-w-6xl items-center justify-between rounded-full px-3 transition-[height,max-width,transform,box-shadow] duration-500 ease-out sm:px-4",
          { "glass-nav-scrolled h-14 max-w-5xl translate-y-0.5": scrolled }
        )}
      >
        <div className="flex items-center gap-4">
          <a
            href="#top"
            className="glass-specular flex items-center rounded-full p-1.5 transition-colors hover:bg-white/[0.14]"
          >
            <Image
              src="/atom-log.png"
              alt="atom"
              width={260}
              height={90}
              priority
              className="h-9 w-auto"
            />
          </a>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="rounded-full bg-transparent text-cool-white/[0.82] shadow-none transition-all hover:bg-white/[0.14] hover:text-cool-white data-[state=open]:bg-white/[0.16] data-[state=open]:text-cool-white">
                  Product
                </NavigationMenuTrigger>
                <NavigationMenuContent className="glass-panel animate-glass-drop rounded-2xl border-0 p-1 pr-1.5">
                  <ul className="grid w-lg grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                    {productLinks.map((item, i) => (
                      <li key={i}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                  <div className="p-2">
                    <p className="text-sm text-cool-white/60">
                      Interested?{" "}
                      <a
                        href="#cta"
                        className="font-medium text-ocean-blue hover:underline"
                      >
                        Request a demo
                      </a>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="rounded-full bg-transparent text-cool-white/[0.82] shadow-none transition-all hover:bg-white/[0.14] hover:text-cool-white data-[state=open]:bg-white/[0.16] data-[state=open]:text-cool-white">
                  Company
                </NavigationMenuTrigger>
                <NavigationMenuContent className="glass-panel animate-glass-drop rounded-2xl border-0 p-1 pr-1.5 pb-1.5">
                  <div className="grid w-lg grid-cols-2 gap-2">
                    <ul className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                      {companyLinks.map((item, i) => (
                        <li key={i}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 p-3">
                      {companyLinks2.map((item, i) => (
                        <li key={i}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex flex-row items-center gap-x-2 rounded-md p-2 hover:bg-white/10"
                          >
                            <item.icon className="size-4 text-cool-white" />
                            <span className="font-medium text-cool-white">
                              {item.title}
                            </span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuLink className="px-2" asChild>
                <a
                  href="#how-it-works"
                  className="rounded-full px-4 py-2 text-sm font-medium text-cool-white/[0.82] transition-colors hover:bg-white/[0.14] hover:text-cool-white"
                >
                  How it Works
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink className="px-2" asChild>
                <a
                  href="#features"
                  className="rounded-full px-4 py-2 text-sm font-medium text-cool-white/[0.82] transition-colors hover:bg-white/[0.14] hover:text-cool-white"
                >
                  Features
                </a>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="outline"
            className="glass-specular rounded-full border-white/20 bg-white/[0.08] text-cool-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-white/[0.14]"
            asChild
          >
            <a href="#cta">Sign In</a>
          </Button>
          <Button
            className="glass-specular rounded-full border border-white/25 bg-cool-white/85 text-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_28px_rgba(110,173,188,0.26)] hover:bg-cool-white"
            asChild
          >
            <a href="#cta">Get Started</a>
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="glass-specular rounded-full border-white/20 bg-white/[0.08] hover:bg-white/[0.14] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>
      <MobileMenu
        open={open}
        className="flex flex-col justify-between gap-2 overflow-y-auto"
      >
        <div className="flex w-full flex-col gap-y-2">
          <span className="px-1 text-sm text-cool-white/50">Product</span>
          {productLinks.map((link) => (
            <ListItem key={link.title} {...link} />
          ))}
          <span className="px-1 text-sm text-cool-white/50">Company</span>
          {companyLinks.map((link) => (
            <ListItem key={link.title} {...link} />
          ))}
          {companyLinks2.map((link) => (
            <ListItem key={link.title} {...link} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full rounded-full border-white/15 bg-white/5 hover:bg-white/10"
            asChild
          >
            <a href="#cta">Sign In</a>
          </Button>
          <Button
            className="w-full rounded-full bg-ocean-blue text-charcoal hover:bg-ocean-blue/90"
            asChild
          >
            <a href="#cta">Get Started</a>
          </Button>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & {
  open: boolean;
};

function MobileMenu({
  open,
  children,
  className,
  ...props
}: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      id="mobile-menu"
      className="glass-panel animate-glass-drop fixed inset-x-3 top-20 z-40 flex max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-3xl sm:inset-x-4 sm:top-[4.75rem] md:hidden"
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn("size-full overflow-y-auto p-4", className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        "flex w-full flex-row gap-x-2 rounded-xl p-2 transition-colors hover:bg-white/10 focus:bg-white/10",
        className
      )}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="flex size-12 aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 shadow-sm">
          <Icon className="size-5 text-ocean-blue" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium text-cool-white">{title}</span>
          <span className="text-xs text-cool-white/50">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}

const productLinks: LinkItem[] = [
  {
    title: "Real-time Detection",
    href: "#features",
    description: "Continuous monitoring across endpoints and cloud",
    icon: IconRadar,
  },
  {
    title: "AI Anomaly Engine",
    href: "#features",
    description: "Deep learning models flag deviations instantly",
    icon: IconDna2,
  },
  {
    title: "Automated Response",
    href: "#features",
    description: "Playbooks isolate and remediate without delay",
    icon: IconRobot,
  },
  {
    title: "Behavioral Analysis",
    href: "#features",
    description: "Catch insider threats and compromised credentials",
    icon: IconChartBar,
  },
  {
    title: "Zero-Day Recognition",
    href: "#features",
    description: "Pattern-matching for novel, unseen exploits",
    icon: IconShieldSearch,
  },
  {
    title: "Unified Dashboard",
    href: "#product",
    description: "One live view across your entire stack",
    icon: IconDeviceDesktopBolt,
  },
];

const companyLinks: LinkItem[] = [
  {
    title: "How it Works",
    href: "#how-it-works",
    description: "Ingest, detect, analyze, auto-respond",
    icon: IconUsers,
  },
];

const companyLinks2: LinkItem[] = [
  {
    title: "Terms of Service",
    href: "#",
    icon: IconFileText,
  },
  {
    title: "Privacy Policy",
    href: "#",
    icon: IconShield,
  },
];

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(
    () => typeof window !== "undefined" && window.scrollY > threshold
  );

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return scrolled;
}
