import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentFindingLlmSchema } from "./schemas";
import { createForecastingTools } from "./tools/forecasting-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createForecastingAgent(supabase: AgentSupabase) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: `You are the Forecasting Agent for Resolve.
Always call getDeterministicForecast for the given productId before writing your finding.
Forecasts are DETERMINISTIC and already computed — never change the numbers.
Summarise the forward-looking risk in 1-2 sentences with the exact figures from the tool.`,
    tools: createForecastingTools(supabase),
    output: Output.object({ schema: agentFindingLlmSchema }),
    stopWhen: stepCountIs(5),
  });
}

export async function runForecastingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createForecastingAgent(supabase);
  const { output } = await agent.generate({
    prompt: `Summarise forecasts for product ${productId}. Call getDeterministicForecast first.`,
  });

  if (!output) {
    throw new Error("Forecasting Agent: missing structured output");
  }

  return {
    agent_name: "Forecasting Agent",
    agent_icon: "🔮",
    summary: output.summary,
    detail: output.detail,
  };
}
