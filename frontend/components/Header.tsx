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
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent",
        {
          "border-white/10 bg-black/80 backdrop-blur-lg": scrolled,
        }
      )}
    >
      <nav className="mx-auto flex h-28 w-full max-w-7xl items-center justify-between px-1">
        <div className="flex items-center gap-6">
          <a href="#top" className="rounded-md p-2 hover:bg-cool-white/10">
            <Image
              src="/atom-log.png"
              alt="atom"
              width={260}
              height={90}
              priority
              className="h-20 w-auto"
            />
          </a>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-charcoal-surface p-1 pr-1.5">
                  <ul className="grid w-lg grid-cols-2 gap-2 rounded-md border border-ocean-blue/30 bg-charcoal-surface p-2 shadow">
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
                        className="font-medium text-lime-green hover:underline"
                      >
                        Request a demo
                      </a>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-charcoal-surface p-1 pr-1.5 pb-1.5">
                  <div className="grid w-lg grid-cols-2 gap-2">
                    <ul className="space-y-2 rounded-md border border-ocean-blue/30 bg-charcoal-surface p-2 shadow">
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
                            className="flex flex-row items-center gap-x-2 rounded-md p-2 hover:bg-cool-white/10"
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
              <NavigationMenuLink className="px-4" asChild>
                <a
                  href="#how-it-works"
                  className="rounded-md p-2 text-sm font-medium text-cool-white/80 hover:bg-cool-white/10 hover:text-lime-green"
                >
                  How it Works
                </a>
              </NavigationMenuLink>
              <NavigationMenuLink className="px-4" asChild>
                <a
                  href="#features"
                  className="rounded-md p-2 text-sm font-medium text-cool-white/80 hover:bg-cool-white/10 hover:text-lime-green"
                >
                  Features
                </a>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" asChild>
            <a href="#cta">Sign In</a>
          </Button>
          <Button asChild>
            <a href="#cta">Get Started</a>
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
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
          <span className="text-sm text-cool-white/50">Product</span>
          {productLinks.map((link) => (
            <ListItem key={link.title} {...link} />
          ))}
          <span className="text-sm text-cool-white/50">Company</span>
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
            className="w-full bg-transparent"
            asChild
          >
            <a href="#cta">Sign In</a>
          </Button>
          <Button className="w-full" asChild>
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
      className={cn(
        "fixed inset-x-0 bottom-0 top-28 z-40 flex flex-col overflow-hidden border-y border-white/10 bg-black/95 backdrop-blur-lg md:hidden"
      )}
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn("size-full p-4", className)}
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
        "flex w-full flex-row gap-x-2 rounded-sm p-2 hover:bg-cool-white/10 focus:bg-cool-white/10",
        className
      )}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="flex size-12 aspect-square items-center justify-center rounded-md border border-ocean-blue/30 bg-black/40 shadow-sm">
          <Icon className="size-5 text-lime-green" />
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
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
