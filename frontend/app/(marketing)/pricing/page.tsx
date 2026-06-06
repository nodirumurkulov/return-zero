import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing — Hugo",
  description: "Join the Hugo waitlist for early access to commerce incident response.",
};

const TIERS = [
  {
    name: "Early Access",
    price: "Free",
    description: "Join the waitlist and be first in when Hugo opens.",
    cta: "Join Waitlist",
    href: "/#waitlist",
    active: true,
  },
  {
    name: "Teams",
    price: "Coming soon",
    description: "Multi-store monitoring, shared incident rooms, and Slack workflows.",
    cta: "Join Waitlist",
    href: "/#waitlist",
    active: false,
  },
  {
    name: "Enterprise",
    price: "Coming soon",
    description: "Custom thresholds, SSO, and dedicated onboarding for large catalogs.",
    cta: "Join Waitlist",
    href: "/#waitlist",
    active: false,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">Pricing</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Hugo is in early access. Join the waitlist — we&apos;ll reach out when your spot opens.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={
              tier.active
                ? "rounded-2xl border-2 border-primary bg-card/60 p-6 shadow-pop"
                : "rounded-2xl border border-border bg-card/40 p-6 opacity-90"
            }
          >
            <h2 className="text-lg font-semibold">{tier.name}</h2>
            <p className="mt-2 font-mono text-3xl tabnum">{tier.price}</p>
            <p className="mt-4 text-sm text-muted-foreground">{tier.description}</p>
            <Button className="mt-6 w-full" variant={tier.active ? "default" : "outline"} asChild>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
