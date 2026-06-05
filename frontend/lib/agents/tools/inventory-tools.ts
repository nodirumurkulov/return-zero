import "server-only";

import { tool } from "ai";
import { productIdInputSchema, type ProductIdInput } from "../schemas";
import type { AgentSupabase } from "../types";

const movementSince = () =>
  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export function createInventoryTools(supabase: AgentSupabase) {
  return {
    listVariantsWithStock: tool({
      description: "List variant stock levels and zero-stock size variants for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }: ProductIdInput) => {
        const { data: variants } = await supabase
          .from("variants")
          .select("variant_id, option1_value, inventory_quantity")
          .eq("product_id", productId);
        const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) <= 0) ?? [];
        return {
          stockouts: stockouts.map((v) => ({ size: v.option1_value, qty: v.inventory_quantity })),
        };
      },
    }),
    listRecentMovements: tool({
      description: "List inventory movements in the last 90 days for a product's variants",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }: ProductIdInput) => {
        const { data: variants } = await supabase
          .from("variants")
          .select("variant_id")
          .eq("product_id", productId);
        const variantIds = variants?.map((v) => v.variant_id) ?? [];
        if (variantIds.length === 0) {
          return { recent_movement_count: 0 };
        }
        const { data: movements } = await supabase
          .from("inventory_movements")
          .select("variant_id, type, quantity_delta, date")
          .in("variant_id", variantIds)
          .gte("date", movementSince())
          .order("date", { ascending: false });
        return { recent_movement_count: movements?.length ?? 0 };
      },
    }),
  };
}
