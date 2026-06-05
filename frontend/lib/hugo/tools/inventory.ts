import "server-only";

import { tool } from "ai";

import { productIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";

const movementSince = () =>
  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

export function createInventoryTools(ctx: HugoToolContext) {
  return {
    getInventoryForProduct: tool({
      description: "List variant stock levels and zero-stock size variants for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }) => {
        const { data: variants } = await ctx.supabase
          .from("variants")
          .select("id, option1_value, inventory_quantity, price")
          .eq("organization_id", ctx.organizationId)
          .eq("product_id", productId);
        const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) <= 0) ?? [];
        return {
          variant_count: variants?.length ?? 0,
          stockouts: stockouts.map((v) => ({ size: v.option1_value, qty: v.inventory_quantity })),
        };
      },
    }),
    getInventoryMovements: tool({
      description: "Count inventory movements in the last 90 days for a product's variants",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }) => {
        const { data: variants } = await ctx.supabase
          .from("variants")
          .select("id")
          .eq("organization_id", ctx.organizationId)
          .eq("product_id", productId);
        const variantIds = variants?.map((v) => v.id) ?? [];
        if (variantIds.length === 0) {
          return { recent_movement_count: 0 };
        }
        const { data: movements } = await ctx.supabase
          .from("inventory_movements")
          .select("variant_id, type, quantity_delta, date")
          .eq("organization_id", ctx.organizationId)
          .in("variant_id", variantIds)
          .gte("date", movementSince())
          .order("date", { ascending: false });
        return { recent_movement_count: movements?.length ?? 0 };
      },
    }),
  };
}
