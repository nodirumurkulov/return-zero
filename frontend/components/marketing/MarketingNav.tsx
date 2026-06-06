"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HugoMark } from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/#waitlist", label: "Waitlist" },
] as const;

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The landing page ("/") ships its own self-contained nav, so the shared
  // marketing nav steps aside there to avoid a doubled header.
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav
        aria-label="Marketing"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <HugoMark size={28} />
          <div className="min-w-0 leading-tight">
            <p className="text-[15px] font-semibold tracking-tight" translate="no">
              Hugo
            </p>
            <p className="text-[11px] text-muted-foreground">Commerce IR</p>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => {
              setOpen((value) => !value);
            }}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-border bg-background px-4 py-4 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="flex flex-col gap-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                onClick={() => {
                  setOpen(false);
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
