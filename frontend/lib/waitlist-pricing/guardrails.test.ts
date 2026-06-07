import { describe, expect, it } from "vitest";
import { canAcceptOffer, clampOfferCents } from "./guardrails";

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
});
