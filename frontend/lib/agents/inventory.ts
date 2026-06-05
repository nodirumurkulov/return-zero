import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentFindingLlmSchema } from "./schemas";
import { createInventoryTools } from "./tools/inventory-tools";
import type { AgentSupabase, LlmAgentFinding } from "./types";

function createInventoryAgent(supabase: AgentSupabase, organizationId: string) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: `You are the Inventory Agent for Resolve.
Always call listVariantsWithStock and listRecentMovements for the given productId before writing your finding.
Analyse stock levels and inventory movements. Identify stockouts and reorder urgency. Use only numbers from tools.
Be specific with exact unit counts.`,
    tools: createInventoryTools(supabase, organizationId),
    output: Output.object({ schema: agentFindingLlmSchema }),
    stopWhen: stepCountIs(5),
  });
}

export async function runInventoryAgent(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
): Promise<LlmAgentFinding> {
  const agent = createInventoryAgent(supabase, organizationId);
  const { output } = await agent.generate({
    prompt: `Investigate inventory for product ${productId}. Call listVariantsWithStock and listRecentMovements first.`,
  });

  if (!output) {
    throw new Error("Inventory Agent: missing structured output");
  }

  return {
    agent_name: "Inventory Agent",
    agent_icon: "🏭",
    summary: output.summary,
    detail: output.detail,
  };
}
