import "server-only";

import { Output, ToolLoopAgent } from "ai";
import { getModel } from "@/lib/ai/model";
import { synthesiserLlmSchema } from "./schemas";
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
  const synthesiser = new ToolLoopAgent({
    model: getModel(),
    instructions: SYNTHESIS_INSTRUCTIONS,
    output: Output.object({ schema: synthesiserLlmSchema }),
  });

  const { output } = await synthesiser.generate({
    prompt: `Agent findings:\n${JSON.stringify(findings, null, 2)}`,
  });

  if (!output) {
    throw new Error("Root cause synthesiser: missing structured output");
  }

  return output;
}
