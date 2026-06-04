import "server-only";
import { callLLMJson } from "@/lib/llm";
import { agentFindingLlmSchema } from "./schemas";
import type { AgentSupabase, LlmAgentFinding } from "./types";

export async function runMerchandisingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", productId)
    .single();

  const { data: variants } = await supabase
    .from("variants")
    .select("variant_id, option1_value, option2_value, inventory_quantity, price")
    .eq("product_id", productId);

  const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) < 0) ?? [];

  const context = {
    product,
    variant_count: variants?.length ?? 0,
    stockout_variants: stockouts.map((v) => ({
      size: v.option1_value,
      inventory: v.inventory_quantity,
    })),
    has_size_guide: false,
  };

  const result = await callLLMJson(
    [
      {
        role: "system",
        content: `You are the Merchandising Agent for Resolve.
Analyse product and variant data. Identify sizing gaps, stockouts, missing guidance.
Respond with JSON: { "summary": "...", "detail": {...} }. Summary must be specific with numbers.`,
      },
      {
        role: "user",
        content: `Product merchandising data:\n${JSON.stringify(context, null, 2)}`,
      },
    ],
    agentFindingLlmSchema,
  );

  return {
    agent_name: "Merchandising Agent",
    agent_icon: "🛍️",
    summary: result?.summary ?? `${stockouts.length} size variants at negative stock`,
    detail: result?.detail ?? context,
  };
}
