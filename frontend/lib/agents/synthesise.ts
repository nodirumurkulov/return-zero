import "server-only";

import { createSynthesisAgent } from "@/lib/ai/agent";
import { synthesiserOutputSchema } from "./schemas";
import type { InvestigationAction, LlmAgentFinding } from "./types";

const SYNTHESIS_INSTRUCTIONS = `You are the root cause synthesiser for Resolve, a commerce incident response platform.
Given findings from investigation agents, produce a concise root cause narrative and 3-4 concrete action recommendations.
Root cause should be 2-3 sentences, specific, mentioning exact numbers from the findings.
Auto-deploy should only be true for low-risk, purely additive actions (e.g. adding content).`;

export async function synthesiseRootCause(findings: LlmAgentFinding[]): Promise<{
  root_cause: string;
  root_cause_confidence: number;
  actions: InvestigationAction[];
}> {
  const synthesiser = createSynthesisAgent({
    instructions: SYNTHESIS_INSTRUCTIONS,
    outputSchema: synthesiserOutputSchema,
  });

  const { output } = await synthesiser.generate({
    prompt: `Agent findings:\n${JSON.stringify(findings, null, 2)}`,
  });

  if (!output) {
    throw new Error("Root cause synthesiser: missing structured output");
  }

  return output;
}
