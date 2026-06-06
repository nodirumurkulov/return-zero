import type { PricingTier } from "./schemas";

export type PricingTierCatalogEntry = {
  id: PricingTier | "early_access";
  name: string;
  priceLabel: string;
  description: string;
  cta: string;
  href: string;
  active: boolean;
  listPriceCents: number | null;
  floorPriceCents: number | null;
  ceilingPriceCents: number | null;
  negotiable: boolean;
};

export const PRICING_TIERS: readonly PricingTierCatalogEntry[] = [
  {
    id: "early_access",
    name: "Early Access",
    priceLabel: "Free",
    description: "Join the waitlist and be first in when Hugo opens.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: true,
    listPriceCents: null,
    floorPriceCents: null,
    ceilingPriceCents: null,
    negotiable: false,
  },
  {
    id: "teams",
    name: "Teams",
    priceLabel: "From $499/mo",
    description: "Multi-store monitoring, shared incident rooms, and Slack workflows.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: false,
    listPriceCents: 49_900,
    floorPriceCents: 29_900,
    ceilingPriceCents: 49_900,
    negotiable: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "From $1,999/mo",
    description: "Custom thresholds, SSO, and dedicated onboarding for large catalogs.",
    cta: "Join waitlist",
    href: "/#waitlist",
    active: false,
    listPriceCents: 199_900,
    floorPriceCents: 99_900,
    ceilingPriceCents: 249_900,
    negotiable: true,
  },
] as const;

export function getNegotiableTier(tier: PricingTier): PricingTierCatalogEntry {
  const entry = PRICING_TIERS.find((item) => item.id === tier);
  if (!entry || !entry.negotiable || entry.floorPriceCents === null || entry.ceilingPriceCents === null) {
    throw new Error(`waitlist-pricing: invalid negotiable tier ${tier}`);
  }
  return entry;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function catalogPromptText(): string {
  return PRICING_TIERS.filter((tier) => tier.negotiable)
    .map((tier) => {
      const floor = tier.floorPriceCents ?? 0;
      const list = tier.listPriceCents ?? 0;
      const ceiling = tier.ceilingPriceCents ?? 0;
      return (
        `${tier.name}: list ${formatUsdFromCents(list)}/mo, ` +
        `authorized range ${formatUsdFromCents(floor)}–${formatUsdFromCents(ceiling)}/mo. ` +
        `${tier.description}`
      );
    })
    .join("\n");
}

export function marketingTiers() {
  return PRICING_TIERS.map(({ id: _id, listPriceCents: _l, floorPriceCents: _f, ceilingPriceCents: _c, negotiable: _n, ...tier }) => tier);
}
