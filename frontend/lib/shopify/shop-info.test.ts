import { describe, expect, it, vi } from "vitest";

import type { ShopifyAdminClient } from "./client";
import { fetchShopInfo } from "./shop-info";

describe("fetchShopInfo", () => {
  it("parses shop.json payload", async () => {
    const client = {
      fetch: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            shop: {
              id: 548380009,
              name: "Snowdevil",
              email: "owner@example.com",
              myshopify_domain: "snowdevil.myshopify.com",
            },
          }),
          { status: 200 },
        ),
      ),
    } as unknown as ShopifyAdminClient;

    await expect(fetchShopInfo(client)).resolves.toEqual({
      id: "548380009",
      name: "Snowdevil",
      email: "owner@example.com",
      myshopifyDomain: "snowdevil.myshopify.com",
    });
    expect(client.fetch).toHaveBeenCalledWith("/shop.json");
  });

  it("throws when shop fetch fails", async () => {
    const client = {
      fetch: vi.fn().mockResolvedValue(new Response("", { status: 401 })),
    } as unknown as ShopifyAdminClient;

    await expect(fetchShopInfo(client)).rejects.toThrow("Shopify shop fetch failed (401)");
  });
});
