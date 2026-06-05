import "server-only";

import { tool } from "ai";
import { productIdInputSchema, type ProductIdInput } from "../schemas";
import type { AgentSupabase } from "../types";

export function createMerchandisingTools(supabase: AgentSupabase) {
  return {
    getProductDetails: tool({
      description: "Fetch product catalog record for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }: ProductIdInput) => {
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("product_id", productId)
          .single();
        return { product, has_size_guide: false };
      },
    }),
    listVariants: tool({
      description: "List variants and stockout sizes for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }: ProductIdInput) => {
        const { data: variants } = await supabase
          .from("variants")
          .select("variant_id, option1_value, option2_value, inventory_quantity, price")
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
