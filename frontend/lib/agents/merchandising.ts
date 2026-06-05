import "server-only";

import { createInvestigationAgent } from "@/lib/ai/agent";
import { agentFindingOutputSchema } from "./schemas";
import { createMerchandisingTools } from "./tools/merchandising-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createMerchandisingAgent(supabase: AgentSupabase) {
  return createInvestigationAgent({
    instructions: `You are the Merchandising Agent for Resolve.
Always call getProductDetails and listVariants for the given productId before writing your finding.
Analyse product and variant data. Identify sizing gaps, stockouts, missing guidance. Use only numbers from tools.
The summary must be specific with numbers.`,
    tools: createMerchandisingTools(supabase),
    outputSchema: agentFindingOutputSchema,
  });
}

export async function runMerchandisingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createMerchandisingAgent(supabase);
  const { output } = await agent.generate({
    prompt: `Investigate merchandising for product ${productId}. Call getProductDetails and listVariants first.`,
  });

  if (!output) {
    throw new Error("Merchandising Agent: missing structured output");
  }

  return {
    agent_name: "Merchandising Agent",
    agent_icon: "🛍️",
    summary: output.summary,
    detail: output.detail,
  };
}
