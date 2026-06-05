import "server-only";

import { createInvestigationAgent } from "@/lib/ai/agent";
import { agentFindingOutputSchema } from "./schemas";
import { createMarketingTools } from "./tools/marketing-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createMarketingAgent(supabase: AgentSupabase) {
  return createInvestigationAgent({
    instructions: `You are the Marketing Agent for Resolve.
Always call getCampaignAttribution for the given productId before writing your finding.
Analyse campaign performance data. Identify underperforming spend, traffic quality issues. Use only numbers from tools.
The summary must be 1-2 sentences with exact numbers.`,
    tools: createMarketingTools(supabase),
    outputSchema: agentFindingOutputSchema,
  });
}

export async function runMarketingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createMarketingAgent(supabase);
  const { output } = await agent.generate({
    prompt: `Investigate marketing for product ${productId}. Call getCampaignAttribution first.`,
  });

  if (!output) {
    throw new Error("Marketing Agent: missing structured output");
  }

  return {
    agent_name: "Marketing Agent",
    agent_icon: "📣",
    summary: output.summary,
    detail: output.detail,
  };
}
