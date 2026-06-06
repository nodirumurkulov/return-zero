import "server-only";

import { getShopifyApi } from "./config";
import { ShopifyError } from "./errors";

export type NormalizedShop = {
  shop: string;
  myshopifyDomain: string;
};

export function normalizeShop(input: string): NormalizedShop {
  const trimmed = input.trim().toLowerCase();
  const candidate = trimmed.includes(".") ? trimmed : `${trimmed}.myshopify.com`;

  try {
    const cleanShop = getShopifyApi().utils.sanitizeShop(candidate, true);
    if (!cleanShop) {
      throw new ShopifyError("Invalid Shopify shop domain");
    }

    return {
      shop: cleanShop.replace(/\.myshopify\.com$/, ""),
      myshopifyDomain: cleanShop,
    };
  } catch {
    throw new ShopifyError("Invalid Shopify shop domain");
  }
}
