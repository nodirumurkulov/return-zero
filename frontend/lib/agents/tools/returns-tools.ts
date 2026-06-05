import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { orderIdsForProduct } from "../product-orders";
import type { AgentSupabase } from "../types";

export async function fetchReturnsContext(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
) {
  const orderIds = await orderIdsForProduct(supabase, organizationId, productId);

  const refundData =
    orderIds.length === 0
      ? []
      : (
          await supabase
            .from("refunds")
            .select("id, amount, reason, created_at, order_id")
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

export function createReturnsTools(supabase: AgentSupabase, organizationId: string) {
  return {
    listRefundsForProduct: tool({
      description: "List refunds for all orders of a product with reason breakdown and totals",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => fetchReturnsContext(supabase, organizationId, productId),
    }),
  };
}
