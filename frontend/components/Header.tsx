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
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navLinks = [
  { label: "Logs", href: "#live-checkpoint-metrics" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "MCP", href: "#mcp" },
  { label: "Docs", href: "#docs" },
];

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
              className="h-full w-auto"
            />
          </a>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Product, Company, and Features nav items intentionally hidden. */}
              {navLinks.map((link) => (
                <NavigationMenuLink key={link.href} className="px-1" asChild>
                  <a
                    href={link.href}
                    className="rounded-full px-4 py-2 text-sm font-medium text-cool-white/[0.82] transition-colors hover:bg-white/[0.14] hover:text-cool-white"
                  >
                    {link.label}
                  </a>
                </NavigationMenuLink>
              ))}
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
          {/* Product, Company, and Features mobile nav items intentionally hidden. */}
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-medium text-cool-white transition-colors hover:bg-white/10"
            >
              {link.label}
            </a>
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
