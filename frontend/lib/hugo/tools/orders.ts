import "server-only";

import { tool } from "ai";

import { productIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";

const MAX_ORDER_IDS = 500;

export async function orderIdsForProduct(
  ctx: HugoToolContext,
  productId: string,
): Promise<string[]> {
  const { data } = await ctx.supabase
    .from("line_items")
    .select("order_id")
    .eq("organization_id", ctx.organizationId)
    .eq("product_id", productId);

  const ids = [...new Set((data ?? []).map((row) => row.order_id))];
  return ids.slice(0, MAX_ORDER_IDS);
}

export async function campaignNamesForProduct(ctx: HugoToolContext, productId: string): Promise<string[]> {
  const orderIds = await orderIdsForProduct(ctx, productId);
  if (orderIds.length === 0) return [];

  const { data: orders } = await ctx.supabase
    .from("orders")
    .select("utm_campaign")
    .eq("organization_id", ctx.organizationId)
    .in("id", orderIds);

  return [
    ...new Set(
      (orders ?? [])
        .map((row) => row.utm_campaign)
        .filter((name): name is string => name != null && name.length > 0),
    ),
  ];
}

export function createOrdersTools(ctx: HugoToolContext) {
  return {
    listOrdersForProduct: tool({
      description: "List order ids and count for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }) => {
        const orderIds = await orderIdsForProduct(ctx, productId);
        return { product_id: productId, order_count: orderIds.length, order_ids: orderIds.slice(0, 20) };
      },
    }),
  };
}
