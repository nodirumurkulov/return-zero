import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentStepHandlers, type InvestigationStepEmitter } from "./investigation-steps";
import { operatorOutputSchema } from "./schemas";
import { createBusinessContextTools } from "./tools/business-context";
import type { AgentSupabase, OperatorOutput, QuantDiagnosis } from "./types";

const OPERATOR_INSTRUCTIONS = `You are the Operator for Hugo — a seasoned e-commerce operator who turns the Quant Analyst's
diagnosis into a clear root cause and a short, costed, goal-aligned action plan.

Process:
- Call getBusinessProfile first to learn the store's primary goal, hero products, target margin,
  min ROAS, and lead/buffer days.
- Read the quant diagnosis you are given. Cite its exact figures (z, σ, £, units) in your root cause.

Judgment rules:
- Weight actions by the primary goal:
  - growth  → prioritise availability (reorders, stockout fixes) and ROAS/scaling winners.
  - margin  → prioritise the dominant margin drivers (COGS, discounts, refund drag, ad waste).
  - cash    → smaller, staged reorders; defer or cut low-ROAS spend; preserve working capital.
- Hero products get higher priority and can justify more aggressive action.
- Confidence discipline: your root_cause_confidence and each action's confidence must NEVER exceed
  the confidence of the quant findings they rest on. When the quant is "low" or "none", recommend
  cheap, reversible actions (small test reorders, pause/observe) rather than big committing bets.

Output:
- root_cause: 2-3 sentences, specific, citing the quant's numbers.
- root_cause_confidence: 0-100, consistent with the quant's confidence grades.
- actions: 3-4 items. Each has title, description, impact_level, risk_level, auto_deploy
  (true only for low-risk, purely additive changes), goal_rationale (why this serves the primary
  goal), estimated_impact_gbp (from the quant's £ figures; null if unknown), and confidence.`;

export async function runOperator(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
  diagnosis: QuantDiagnosis,
  steps?: InvestigationStepEmitter,
): Promise<OperatorOutput> {
  const stepHooks = steps ? agentStepHandlers(steps, "Operator", "operator") : {};

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: OPERATOR_INSTRUCTIONS,
    tools: createBusinessContextTools(supabase, organizationId),
    output: Output.object({ schema: operatorOutputSchema }),
    stopWhen: stepCountIs(6),
    // Action objects carry nullable/optional fields; relax OpenAI strict mode so
    // they serialise. (Ignored by the Anthropic provider.)
    providerOptions: { openai: { strictJsonSchema: false } },
  });

  const { output } = await agent.generate({
    prompt: `Product ${productId}. Call getBusinessProfile, then turn this quant diagnosis into a goal-aligned root cause and costed actions:\n\n${JSON.stringify(diagnosis, null, 2)}`,
    ...stepHooks,
  });

  if (!output) {
    throw new Error("Operator: missing structured output");
  }

  return output;
}
