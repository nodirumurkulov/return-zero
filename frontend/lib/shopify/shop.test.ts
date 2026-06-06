import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetShopifyApiForTests } from "./config";
import { ShopifyError } from "./errors";
import { buildAuthorizeUrl } from "./oauth";
import { normalizeShop } from "./shop";

describe("normalizeShop", () => {
  beforeEach(() => {
    process.env.SHOPIFY_API_KEY = "test-key";
    process.env.SHOPIFY_API_SECRET = "test-secret";
    resetShopifyApiForTests();
  });

  afterEach(() => {
    resetShopifyApiForTests();
  });

  it("accepts a bare shop handle", () => {
    expect(normalizeShop("Demo-Store")).toEqual({
      shop: "demo-store",
      myshopifyDomain: "demo-store.myshopify.com",
    });
  });

  it("accepts a full myshopify host", () => {
    expect(normalizeShop("demo-store.myshopify.com")).toEqual({
      shop: "demo-store",
      myshopifyDomain: "demo-store.myshopify.com",
    });
  });

  it("rejects invalid hosts", () => {
    expect(() => normalizeShop("not a shop")).toThrow(ShopifyError);
    expect(() => normalizeShop("evil.com")).toThrow(ShopifyError);
  });
});

describe("buildAuthorizeUrl", () => {
  beforeEach(() => {
    process.env.SHOPIFY_API_KEY = "test-key";
    process.env.SHOPIFY_API_SECRET = "test-secret";
    resetShopifyApiForTests();
  });

  afterEach(() => {
    resetShopifyApiForTests();
  });

  it("builds a Shopify authorize URL", () => {
    const url = buildAuthorizeUrl({
      shop: "demo-store",
      state: "state-token",
      redirectUri: "https://app.example.com/api/shopify/callback",
      apiKey: "client-id",
      scopes: "read_products",
    });

    const parsed = new URL(url);
    expect(parsed.hostname).toBe("demo-store.myshopify.com");
    expect(parsed.pathname).toBe("/admin/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("client-id");
    expect(parsed.searchParams.get("scope")).toBe("read_products");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "https://app.example.com/api/shopify/callback",
    );
    expect(parsed.searchParams.get("state")).toBe("state-token");
  });
});
