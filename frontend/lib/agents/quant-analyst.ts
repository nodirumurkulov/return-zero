import "server-only";

import { Output, stepCountIs, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { agentStepHandlers, type InvestigationStepEmitter } from "./investigation-steps";
import { quantDiagnosisSchema } from "./schemas";
import { createQuantTools } from "./tools/quant-tools";
import type { AgentSupabase, QuantDiagnosis } from "./types";

const QUANT_INSTRUCTIONS = `You are the Quant Analyst for Hugo, a commerce incident-response platform.
You reason like a retail / operations-research quant — NOT a Wall-Street quant. The data is thin
(at most ~24 monthly points, often fewer per product), so you prove problems with simple, honest
statistics and you NEVER manufacture confidence the data cannot support.

Process:
- Call the tools to gather numbers: getAnomalyProfile (always), then getRoasReallocation when
  marketing efficiency is relevant to the breach.
- Use ONLY numbers returned by the tools. Never invent figures.

Honesty rules (critical):
- Grade every finding's confidence from the sample size the tools report (high / moderate / low / none).
- When n is small or no baseline exists, say so plainly, widen your language, and set confidence to
  "low" or "none". A wide or missing confidence interval means "we don't know yet", not "fine".
- An anomaly is only real when |z| >= 2 AND n >= 6; otherwise call it a watch-item, not a breach.

Output a diagnosis: ONE finding per analytical dimension you investigated (anomaly/SPC, marketing).
For each finding:
- agent_name: a short label (e.g. "Anomaly (SPC)", "Marketing").
- agent_icon: a single relevant emoji.
- summary: 1-2 sentences with exact figures (value, z, σ, £, units) and an explicit confidence word.
- z_score / sigma / ci / confidence / quantity: fill from the tools where they exist, else leave null.
- detail: the structured numbers behind the finding.

You DIAGNOSE only — do NOT propose actions. The Operator will decide what to do.`;

export async function runQuantAnalyst(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
  steps?: InvestigationStepEmitter,
): Promise<QuantDiagnosis> {
  const stepHooks = steps ? agentStepHandlers(steps, "Quant Analyst", "quant") : {};

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: QUANT_INSTRUCTIONS,
    tools: createQuantTools(supabase, organizationId),
    output: Output.object({ schema: quantDiagnosisSchema }),
    stopWhen: stepCountIs(10),
    providerOptions: { openai: { strictJsonSchema: false } },
  });

  const { output } = await agent.generate({
    prompt: `Diagnose product ${productId}. Start with getAnomalyProfile, then call getRoasReallocation if marketing is relevant. Be explicit about confidence and small-sample caveats.`,
    ...stepHooks,
  });

  if (!output) {
    throw new Error("Quant Analyst: missing structured output");
  }

  return output;
}
