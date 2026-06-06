import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetShopifyApiForTests } from "./config";
import { verifyOAuthHmac } from "./oauth";
import {
  createOAuthStateCookie,
  parseOAuthState,
  signOAuthState,
} from "./state";

function oauthQueryHmac(
  params: Record<string, string>,
  secret: string,
): string {
  const processed = new URLSearchParams();
  Object.keys(params)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      processed.append(key, params[key] ?? "");
    });
  return createHmac("sha256", secret).update(processed.toString()).digest("hex");
}

describe("verifyOAuthHmac", () => {
  beforeEach(() => {
    process.env.SHOPIFY_API_KEY = "test-key";
    process.env.SHOPIFY_API_SECRET = "test-secret";
    resetShopifyApiForTests();
  });

  afterEach(() => {
    resetShopifyApiForTests();
  });

  it("accepts HMAC over sorted callback params", async () => {
    const params = {
      code: "auth-code",
      shop: "demo.myshopify.com",
      state: "state-token",
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const hmac = oauthQueryHmac(params, "test-secret");

    await expect(verifyOAuthHmac({ ...params, hmac })).resolves.toBe(true);
  });

  it("rejects tampered callback params", async () => {
    const params = {
      code: "auth-code",
      shop: "demo.myshopify.com",
      state: "state-token",
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const hmac = oauthQueryHmac(params, "test-secret");

    await expect(
      verifyOAuthHmac({ ...params, shop: "evil.myshopify.com", hmac }),
    ).resolves.toBe(false);
  });
});

describe("OAuth state cookie", () => {
  const secret = "test-state-secret";
  const payload = {
    shop: "demo.myshopify.com",
    nonce: "nonce-123",
    intent: "login" as const,
    returnTo: "/onboarding",
  };

  it("round-trips signed state", () => {
    const signed = signOAuthState(payload, secret);
    expect(parseOAuthState(signed, secret)).toEqual(payload);
  });

  it("rejects tampered state", () => {
    const signed = signOAuthState(payload, secret);
    const tampered = `${signed}x`;
    expect(parseOAuthState(tampered, secret)).toBeNull();
  });

  it("creates an HttpOnly cookie descriptor", () => {
    const cookie = createOAuthStateCookie(payload, secret);
    expect(cookie.name).toBe("shopify_oauth_state");
    expect(cookie.options.httpOnly).toBe(true);
    expect(parseOAuthState(cookie.value, secret)).toEqual(payload);
  });
});
