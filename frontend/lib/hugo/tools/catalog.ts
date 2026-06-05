import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { computeProductHealth, listCatalogWithThresholds } from "@/lib/stores/analytics/catalog";

import type { HugoToolContext } from "./context";

export function createCatalogTools(ctx: HugoToolContext) {
  return {
    getCatalogHealth: tool({
      description: "List catalog products with KPI breaches and threshold health levels",
      inputSchema: z.object({}),
      execute: async () => {
        const { products, thresholdsByProduct } = await listCatalogWithThresholds(
          ctx.supabase,
          ctx.organizationId,
        );

        const breaches = products
          .map((p) => ({
            product_id: p.product_id,
            title: p.title,
            return_rate: p.return_rate,
            refund_rate: p.refund_rate,
            ad_roas: p.ad_roas,
            level: computeProductHealth(p, thresholdsByProduct[p.product_id] ?? []),
          }))
          .filter((row) => row.level !== "healthy");

        return {
          product_count: products.length,
          breach_count: breaches.length,
          breaches: breaches.slice(0, 20),
        };
      },
    }),
    getProductDetails: tool({
      description: "Fetch product catalog record for a product",
      inputSchema: z.object({ productId: z.uuid() }),
      execute: async ({ productId }) => {
        const { data: product } = await ctx.supabase
          .from("products")
          .select("*")
          .eq("organization_id", ctx.organizationId)
          .eq("id", productId)
          .single();
        return { product, has_size_guide: false };
      },
    }),
  };
}
