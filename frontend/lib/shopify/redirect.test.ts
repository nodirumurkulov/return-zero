import { describe, expect, it } from "vitest";

import { resolveOAuthRedirect } from "./redirect";

describe("resolveOAuthRedirect", () => {
  it("returns catalog for returning login when shop was already connected", () => {
    expect(
      resolveOAuthRedirect({
        intent: "login",
        hadShopifyConnection: true,
      }),
    ).toBe("/catalog");
  });

  it("overrides default onboarding returnTo to catalog for returning login", () => {
    expect(
      resolveOAuthRedirect({
        intent: "login",
        hadShopifyConnection: true,
        returnTo: "/onboarding",
      }),
    ).toBe("/catalog");
  });

  it("keeps explicit returnTo for connect intent", () => {
    expect(
      resolveOAuthRedirect({
        intent: "connect",
        hadShopifyConnection: false,
        returnTo: "/onboarding",
      }),
    ).toBe("/onboarding");
  });

  it("defaults to onboarding for first-time login", () => {
    expect(
      resolveOAuthRedirect({
        intent: "login",
        hadShopifyConnection: false,
      }),
    ).toBe("/onboarding");
  });
});
