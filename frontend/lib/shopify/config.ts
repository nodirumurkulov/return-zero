import "@shopify/shopify-api/adapters/node";
import "server-only";

import { ApiVersion, shopifyApi, type Shopify } from "@shopify/shopify-api";

import { ShopifyError } from "./errors";

const shopifyState: { instance: Shopify | null } = { instance: null };

function parseHost(): { hostName: string; hostScheme: "http" | "https" } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const parsed = new URL(appUrl);
  return {
    hostName: parsed.host,
    hostScheme: parsed.protocol === "https:" ? "https" : "http",
  };
}

export function parseShopifyScopes(): string[] {
  const raw =
    process.env.SHOPIFY_SCOPES ??
    "read_products,read_orders,read_customers,read_inventory";
  return raw
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function getShopifyApi(): Shopify {
  if (shopifyState.instance) {
    return shopifyState.instance;
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecretKey) {
    throw new ShopifyError("Shopify API credentials are not configured");
  }

  const { hostName, hostScheme } = parseHost();

  shopifyState.instance = shopifyApi({
    apiKey,
    apiSecretKey,
    scopes: parseShopifyScopes(),
    hostName,
    hostScheme,
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: false,
  });

  return shopifyState.instance;
}

/** Test-only: reset cached SDK instance after env changes. */
export function resetShopifyApiForTests(): void {
  shopifyState.instance = null;
}
