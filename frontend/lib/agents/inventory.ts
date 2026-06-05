import "server-only";
import { callLLMJson } from "@/lib/llm";
import { agentFindingLlmSchema } from "./schemas";
import type { AgentSupabase, LlmAgentFinding } from "./types";

export async function runInventoryAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const { data: variants } = await supabase
    .from("variants")
    .select("variant_id, option1_value, inventory_quantity")
    .eq("product_id", productId);

  const variantIds = variants?.map((v) => v.variant_id) ?? [];

  const { data: movements } =
    variantIds.length === 0
      ? { data: [] }
      : await supabase
          .from("inventory_movements")
          .select("variant_id, type, quantity_delta, date")
          .in("variant_id", variantIds)
          .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("date", { ascending: false });

  const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) <= 0) ?? [];

  const context = {
    product_id: productId,
    stockouts: stockouts.map((v) => ({ size: v.option1_value, qty: v.inventory_quantity })),
    recent_movement_count: movements?.length ?? 0,
  };

  const result = await callLLMJson(
    [
      {
        role: "system",
        content: `You are the Inventory Agent for Resolve.
Analyse stock levels and inventory movements. Identify stockouts, reorder urgency, cascading effects.
Respond with JSON: { "summary": "...", "detail": {...} }. Be specific with exact unit counts.`,
      },
      {
        role: "user",
        content: `Inventory data:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
    agentFindingLlmSchema,
  );

  return {
    agent_name: "Inventory Agent",
    agent_icon: "🏭",
    summary: result?.summary ?? `${stockouts.length} size variants at zero or negative stock`,
    detail: result?.detail ?? context,
  };
}
