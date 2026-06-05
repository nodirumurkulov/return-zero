import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentFindingLlmSchema } from "./schemas";
import { createReturnsTools } from "./tools/returns-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createReturnsAgent(supabase: AgentSupabase) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: `You are the Returns Agent for Resolve, an ecommerce incident response platform.
Always call listRefundsForProduct for the given productId before writing your finding.
Analyse return data and identify patterns. Use only numbers returned by tools.
The summary must be 1-2 sentences, specific, with exact numbers. The detail is structured data.`,
    tools: createReturnsTools(supabase),
    output: Output.object({ schema: agentFindingLlmSchema }),
    stopWhen: stepCountIs(5),
  });
}

export async function runReturnsAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createReturnsAgent(supabase);
  const { output } = await agent.generate({
    prompt: `Investigate returns for product ${productId}. Call listRefundsForProduct first.`,
  });

  if (!output) {
    throw new Error("Returns Agent: missing structured output");
  }

  return {
    agent_name: "Returns Agent",
    agent_icon: "📦",
    summary: output.summary,
    detail: output.detail,
  };
}
