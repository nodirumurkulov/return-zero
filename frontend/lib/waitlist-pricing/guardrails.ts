import { getNegotiableTier } from "./catalog";
import type { AgentTurn, NegotiationState, PricingTier } from "./schemas";

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

export function applyAgentTurn(
  state: NegotiationState,
  turn: AgentTurn,
): {
  state: NegotiationState;
  tier: PricingTier | null;
  offerCents: number | null;
  accepted: boolean;
  declined: boolean;
} {
  const companySignals = {
    ...state.companySignals,
    ...(turn.companySignals ?? {}),
  };

  const userBudgetCents = turn.userBudgetCents ?? state.userBudgetCents;
  const tier = turn.proposedTier;
  const rawPriceCents = turn.proposedPriceCents;
  const offerCents =
    tier && rawPriceCents !== null
      ? clampOfferCents(tier, rawPriceCents)
      : state.currentOfferCents;

  const nextState: NegotiationState = {
    currentOfferCents: offerCents,
    userBudgetCents,
    companySignals,
  };

  const accepted =
    turn.userAccepted &&
    tier !== null &&
    rawPriceCents !== null &&
    canAcceptOffer(tier, rawPriceCents);

  return {
    state: nextState,
    tier: accepted ? tier : tier,
    offerCents,
    accepted,
    declined: turn.userDeclined,
  };
}
