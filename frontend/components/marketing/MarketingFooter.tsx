"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HugoMark } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXPLORE = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/sign-in", label: "Sign in" },
] as const;

const PRODUCT = [
  { href: "/catalog", label: "Catalog" },
  { href: "/incidents", label: "Incidents" },
] as const;

async function subscribe(email: string): Promise<boolean> {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.ok;
}

export function MarketingFooter() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // The landing page ("/") ships its own self-contained footer, so the shared
  // marketing footer steps aside there to avoid a doubled footer.
  if (pathname === "/") return null;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    const ok = await subscribe(email);
    setStatus(ok ? "done" : "error");
    if (ok) {
      setEmail("");
    }
  };

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <HugoMark size={28} />
            <div>
              <p className="text-sm font-semibold" translate="no">
                Hugo
              </p>
              <p className="text-xs text-muted-foreground">Commerce IR</p>
            </div>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Detect, investigate, approve, and recover — in the same UI your team runs the store from.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explore
          </h3>
          <ul className="mt-3 space-y-2">
            {EXPLORE.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product demo
          </h3>
          <ul className="mt-3 space-y-2">
            {PRODUCT.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Waitlist
          </h3>
          <form className="mt-3" onSubmit={(event) => { void onSubmit(event); }}>
            <div className="flex gap-2">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@store.com"
                value={email}
                required
                aria-label="Email for waitlist"
                disabled={status === "loading" || status === "done"}
                className="flex-1"
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
              <Button type="submit" size="sm" disabled={status === "loading" || status === "done"}>
                {status === "loading" ? "…" : "Join"}
              </Button>
            </div>
            {status === "done" ? (
              <p className="mt-2 text-xs text-sev-resolved" role="status">
                Check your inbox to confirm…
              </p>
            ) : null}
            {status === "error" ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                Could not subscribe. Try again.
              </p>
            ) : null}
          </form>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} <span translate="no">Hugo</span>
      </div>
    </footer>
  );
}
