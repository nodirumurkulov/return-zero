import "server-only";
import { callLLMJson } from "@/lib/llm";
import { orderIdsForProduct } from "./product-orders";
import { agentFindingLlmSchema } from "./schemas";
import type { AgentSupabase, LlmAgentFinding } from "./types";

export async function runReturnsAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const orderIds = await orderIdsForProduct(supabase, productId);

  const refundData =
    orderIds.length === 0
      ? []
      : (
          await supabase
            .from("refunds")
            .select("refund_id, amount, reason, created_at, order_id")
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

  const context = {
    product_id: productId,
    order_count: orderIds.length,
    total_refunds: totalRefunds,
    sizing_refunds: sizingRefunds.length,
    total_refund_gbp: totalRefundGBP,
    reason_breakdown: reasonCounts,
  };

  const result = await callLLMJson(
    [
      {
        role: "system",
        content: `You are the Returns Agent for Resolve, an ecommerce incident response platform.
Analyse return data and identify patterns. Respond with a JSON object: { "summary": "...", "detail": {...} }.
The summary must be 1-2 sentences, specific, with exact numbers. The detail is structured data.`,
      },
      {
        role: "user",
        content: `Analyse these returns for product ${productId}:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
    agentFindingLlmSchema,
  );

  return {
    agent_name: "Returns Agent",
    agent_icon: "📦",
    summary: result?.summary ?? `${sizingRefunds.length} sizing refunds totalling £${totalRefundGBP.toFixed(0)}`,
    detail: result?.detail ?? context,
  };
}
