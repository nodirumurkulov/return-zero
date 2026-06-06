import "server-only";

import { Session } from "@shopify/shopify-api";

import { getShopifyApi } from "./config";
import { normalizeShop } from "./shop";

export type ShopifyAdminClient = {
  shop: string;
  apiVersion: string;
  session: Session;
  graphql: InstanceType<ReturnType<typeof getShopifyApi>["clients"]["Graphql"]>;
  rest: InstanceType<ReturnType<typeof getShopifyApi>["clients"]["Rest"]>;
  /** REST path fetch for import loaders (`/products.json`, etc.). */
  fetch: (path: string, init?: RequestInit) => Promise<Response>;
};

export function createShopifyAdminClient(opts: {
  shop: string;
  accessToken: string;
}): ShopifyAdminClient {
  const shopify = getShopifyApi();
  const { myshopifyDomain } = normalizeShop(opts.shop);
  const apiVersion = shopify.config.apiVersion;

  const session = new Session({
    id: `offline_${myshopifyDomain}`,
    shop: myshopifyDomain,
    state: "offline",
    isOnline: false,
    accessToken: opts.accessToken,
  });

  const graphql = new shopify.clients.Graphql({ session });
  const rest = new shopify.clients.Rest({ session });
  const baseUrl = `https://${myshopifyDomain}/admin/api/${apiVersion}`;

  return {
    shop: myshopifyDomain,
    apiVersion,
    session,
    graphql,
    rest,
    fetch: (path, init) => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const url = path.startsWith("http") ? path : `${baseUrl}${normalizedPath}`;

      return fetch(url, {
        ...init,
        headers: {
          "X-Shopify-Access-Token": opts.accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...init?.headers,
        },
      });
    },
  };
}
