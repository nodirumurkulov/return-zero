"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/sign-in", label: "Sign In" },
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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

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
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/catLogo.png" alt="" width={36} height={36} className="rounded-lg" />
            <span className="font-semibold" translate="no">
              Hugo
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Commerce incident response — detect, investigate, fix, and recover in one place.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-4 space-y-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Stay updated</h3>
          <form className="relative mt-4" onSubmit={(event) => { void onSubmit(event); }}>
            <div className="flex gap-2">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@store.com…"
                value={email}
                required
                aria-label="Email for waitlist"
                disabled={status === "loading" || status === "done"}
                className="flex-1"
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
              <Button type="submit" disabled={status === "loading" || status === "done"}>
                {status === "loading" ? "…" : "Subscribe"}
              </Button>
            </div>
            {status === "done" ? (
              <p className="mt-2 text-sm text-sev-resolved" role="status">
                Check your inbox to confirm…
              </p>
            ) : null}
            {status === "error" ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                Could not subscribe. Try again.
              </p>
            ) : null}
          </form>
        </div>
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} <span translate="no">Hugo</span>. Commerce incident response.
      </div>
    </footer>
  );
}
