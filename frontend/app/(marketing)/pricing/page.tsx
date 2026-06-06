import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata: Metadata = {
  title: "Pricing — Hugo",
  description: "Join the Hugo waitlist for early access to commerce incident response.",
};

const TIERS = [
  {
    name: "Early Access",
    price: "Free",
    description: "Join the waitlist and be first in when Hugo opens.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: true,
  },
  {
    name: "Teams",
    price: "Coming soon",
    description: "Multi-store monitoring, shared incident rooms, and Slack workflows.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: false,
  },
  {
    name: "Enterprise",
    price: "Coming soon",
    description: "Custom thresholds, SSO, and dedicated onboarding for large catalogs.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: false,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionLabel>Pricing</SectionLabel>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
        Early access
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Hugo is in early access. Join the waitlist — we&apos;ll reach out when your spot opens.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={
              tier.active
                ? "rounded-lg border-2 border-primary bg-card p-5"
                : "rounded-lg border border-border bg-card/60 p-5"
            }
          >
            <h2 className="text-sm font-semibold">{tier.name}</h2>
            <p className="mt-2 font-mono text-2xl tabnum">{tier.price}</p>
            <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
            <Button className="mt-5 w-full" variant={tier.active ? "default" : "outline"} asChild>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
