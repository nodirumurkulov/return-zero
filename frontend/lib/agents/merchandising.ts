import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentFindingLlmSchema } from "./schemas";
import { createMerchandisingTools } from "./tools/merchandising-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createMerchandisingAgent(supabase: AgentSupabase, organizationId: string) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: `You are the Merchandising Agent for Resolve.
Always call getProductDetails and listVariants for the given productId before writing your finding.
Analyse product and variant data. Identify sizing gaps, stockouts, missing guidance. Use only numbers from tools.
The summary must be specific with numbers.`,
    tools: createMerchandisingTools(supabase, organizationId),
    output: Output.object({ schema: agentFindingLlmSchema }),
    stopWhen: stepCountIs(5),
  });
}

export async function runMerchandisingAgent(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createMerchandisingAgent(supabase, organizationId);
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
