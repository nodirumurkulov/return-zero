import { getNegotiableTier } from "./catalog";
import type { PricingTier } from "./schemas";

export function clampOfferCents(tier: PricingTier, priceCents: number): number {
  const catalog = getNegotiableTier(tier);
  const floor = catalog.floorPriceCents ?? priceCents;
  const ceiling = catalog.ceilingPriceCents ?? priceCents;
  return Math.min(Math.max(priceCents, floor), ceiling);
}

export function canAcceptOffer(tier: PricingTier, priceCents: number): boolean {
  const catalog = getNegotiableTier(tier);
  const floor = catalog.floorPriceCents ?? priceCents;
  const ceiling = catalog.ceilingPriceCents ?? priceCents;
  return priceCents >= floor && priceCents <= ceiling;
}
