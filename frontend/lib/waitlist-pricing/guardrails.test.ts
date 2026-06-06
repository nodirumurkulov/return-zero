import { describe, expect, it } from "vitest";
import { applyAgentTurn, canAcceptOffer, clampOfferCents } from "./guardrails";

describe("waitlist-pricing guardrails", () => {
  it("clamps offers to tier floor and ceiling", () => {
    expect(clampOfferCents("teams", 100)).toBe(29_900);
    expect(clampOfferCents("teams", 49_900)).toBe(49_900);
    expect(clampOfferCents("teams", 99_999)).toBe(49_900);
    expect(clampOfferCents("enterprise", 50_000)).toBe(99_900);
  });

  it("accepts only in-range offers", () => {
    expect(canAcceptOffer("teams", 29_900)).toBe(true);
    expect(canAcceptOffer("teams", 28_999)).toBe(false);
    expect(canAcceptOffer("enterprise", 249_900)).toBe(true);
    expect(canAcceptOffer("enterprise", 250_000)).toBe(false);
  });

  it("finalizes only when userAccepted and price is valid", () => {
    const applied = applyAgentTurn(
      { currentOfferCents: null, userBudgetCents: null, companySignals: {} },
      {
        intent: "accept",
        proposedTier: "teams",
        proposedPriceCents: 39_900,
        userAccepted: true,
        userDeclined: false,
        userBudgetCents: 40_000,
        companySignals: { teamSize: 8 },
      },
    );

    expect(applied.accepted).toBe(true);
    expect(applied.offerCents).toBe(39_900);
    expect(applied.state.userBudgetCents).toBe(40_000);
    expect(applied.state.companySignals.teamSize).toBe(8);
  });

  it("rejects acceptance when price is below floor", () => {
    const applied = applyAgentTurn(
      { currentOfferCents: null, userBudgetCents: null, companySignals: {} },
      {
        intent: "accept",
        proposedTier: "teams",
        proposedPriceCents: 100,
        userAccepted: true,
        userDeclined: false,
        userBudgetCents: null,
      },
    );

    expect(applied.accepted).toBe(false);
    expect(applied.offerCents).toBe(29_900);
  });
});
