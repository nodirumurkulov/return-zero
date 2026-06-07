import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetShopifyApiForTests } from "./config";
import { getShopifyOAuth } from "./oauth-flow";

describe("ShopifyOAuth.beginOAuth", () => {
  beforeEach(() => {
    process.env.SHOPIFY_API_KEY = "test-key";
    process.env.SHOPIFY_API_SECRET = "test-secret";
    resetShopifyApiForTests();
  });

  afterEach(() => {
    resetShopifyApiForTests();
  });

  it("redirects connect intent to sign-in when unauthenticated", () => {
    const oauth = getShopifyOAuth({} as never);
    const result = oauth.beginOAuth({
      query: { shop: "demo", intent: "connect" },
      sessionUserId: null,
      callbackUrl: "http://localhost:3000/api/shopify/callback",
    });

    expect(result).toEqual({
      action: "redirect",
      url: "/sign-in?next=%2Fonboarding",
    });
  });

  it("returns authorize URL for login intent without session", () => {
    const oauth = getShopifyOAuth({} as never);
    const result = oauth.beginOAuth({
      query: { shop: "demo", intent: "login" },
      sessionUserId: null,
      callbackUrl: "http://localhost:3000/api/shopify/callback",
    });

    expect(result.action).toBe("authorize");
    if (result.action === "authorize") {
      expect(result.authorizeUrl).toContain("demo.myshopify.com/admin/oauth/authorize");
      expect(result.cookie.name).toBe("shopify_oauth_state");
    }
  });

  it("rejects invalid shop input", () => {
    const oauth = getShopifyOAuth({} as never);
    const result = oauth.beginOAuth({
      query: { shop: "", intent: "login" },
      sessionUserId: null,
      callbackUrl: "http://localhost:3000/api/shopify/callback",
    });

    expect(result.action).toBe("error");
  });
});
