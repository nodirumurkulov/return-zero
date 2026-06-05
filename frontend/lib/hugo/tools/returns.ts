import "server-only";

import { tool } from "ai";

import { productIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";
import { orderIdsForProduct } from "./orders";

export async function fetchReturnsContext(ctx: HugoToolContext, productId: string) {
  const orderIds = await orderIdsForProduct(ctx, productId);

  const refundData =
    orderIds.length === 0
      ? []
      : (
          await ctx.supabase
            .from("refunds")
            .select("id, amount, reason, created_at, order_id")
            .eq("organization_id", ctx.organizationId)
            .in("order_id", orderIds)
            .order("created_at", { ascending: false })
            .limit(500)
        ).data ?? [];

  const totalRefunds = refundData.length;
  const sizingRefunds = refundData.filter(
    (r) => r.reason?.toLowerCase().includes("size") || r.reason?.toLowerCase().includes("fit"),
  );
  const totalRefundGBP = refundData.reduce((s, r) => s + Number(r.amount), 0);

  const reasonCounts: Record<string, number> = {};
  refundData.forEach((r) => {
    const reason = r.reason ?? "Unknown";
    reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  });

  return {
    product_id: productId,
    order_count: orderIds.length,
    total_refunds: totalRefunds,
    sizing_refunds: sizingRefunds.length,
    total_refund_gbp: totalRefundGBP,
    reason_breakdown: reasonCounts,
  };
}

export function createReturnsTools(ctx: HugoToolContext) {
  return {
    getReturnsForProduct: tool({
      description: "Fetch refund totals, sizing-related refunds, and reason breakdown for a product",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }) => fetchReturnsContext(ctx, productId),
    }),
  };
}
