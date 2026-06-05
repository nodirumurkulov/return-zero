import "server-only";

import { tool } from "ai";
import { z } from "zod";
import type { AgentSupabase } from "../types";

export function createMerchandisingTools(supabase: AgentSupabase, organizationId: string) {
  return {
    getProductDetails: tool({
      description: "Fetch product catalog record for a product",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("id", productId)
          .single();
        return { product, has_size_guide: false };
      },
    }),
    listVariants: tool({
      description: "List variants and stockout sizes for a product",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const { data: variants } = await supabase
          .from("variants")
          .select("id, option1_value, option2_value, inventory_quantity, price")
          .eq("organization_id", organizationId)
          .eq("product_id", productId);
        const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) < 0) ?? [];
        return {
          variant_count: variants?.length ?? 0,
          stockout_variants: stockouts.map((v) => ({
            size: v.option1_value,
            inventory: v.inventory_quantity,
          })),
        };
      },
    }),
  };
}
