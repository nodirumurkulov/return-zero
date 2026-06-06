import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { marketingTiers } from "@/lib/waitlist-pricing";

export const metadata: Metadata = {
  title: "Pricing — Hugo",
  description: "Join the Hugo waitlist for early access to commerce incident response.",
};

export default function PricingPage() {
  const tiers = marketingTiers();

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
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={
              tier.active
                ? "rounded-lg border-2 border-primary bg-card p-5"
                : "rounded-lg border border-border bg-card/60 p-5"
            }
          >
            <h2 className="text-sm font-semibold">{tier.name}</h2>
            <p className="mt-2 font-mono text-2xl tabnum">{tier.priceLabel}</p>
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
