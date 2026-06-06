import "server-only";

import type { ShopifyAdminClient } from "./client";
import { ShopifyError } from "./errors";

export type ShopInfo = {
  id: string;
  name: string;
  email: string;
  myshopifyDomain: string;
};

export async function fetchShopInfo(client: ShopifyAdminClient): Promise<ShopInfo> {
  const response = await client.fetch("/shop.json");
  if (!response.ok) {
    throw new ShopifyError(`Shopify shop fetch failed (${response.status})`);
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("shop" in body) ||
    typeof body.shop !== "object" ||
    body.shop === null
  ) {
    throw new ShopifyError("Shopify shop fetch returned invalid payload");
  }

  const shop = body.shop;
  if (
    !("id" in shop) ||
    !("name" in shop) ||
    !("email" in shop) ||
    !("myshopify_domain" in shop) ||
    (typeof shop.id !== "number" && typeof shop.id !== "string") ||
    typeof shop.name !== "string" ||
    typeof shop.email !== "string" ||
    typeof shop.myshopify_domain !== "string"
  ) {
    throw new ShopifyError("Shopify shop fetch returned incomplete shop data");
  }

  return {
    id: String(shop.id),
    name: shop.name,
    email: shop.email,
    myshopifyDomain: shop.myshopify_domain,
  };
}
