import "server-only";
import { callLLMJson } from "@/lib/llm";
import { synthesiserLlmSchema } from "./schemas";
import type { InvestigationAction, LlmAgentFinding } from "./types";

export async function synthesiseRootCause(findings: LlmAgentFinding[]): Promise<{
  root_cause: string;
  root_cause_confidence: number;
  actions: InvestigationAction[];
}> {
  const result = await callLLMJson(
    [
      {
        role: "system",
        content: `You are the root cause synthesiser for Resolve, a commerce incident response platform.
Given findings from 4 agents, produce a concise root cause narrative and 3-4 concrete action recommendations.
Respond with JSON:
{
  "root_cause": "...",
  "root_cause_confidence": 85,
  "actions": [
    {
      "title": "...",
      "description": "...",
      "impact_level": "high|medium|low",
      "risk_level": "high|medium|low",
      "auto_deploy": false
    }
  ]
}
Root cause should be 2-3 sentences, specific, mentioning exact numbers from the findings.
Auto-deploy should only be true for low-risk, purely additive actions (e.g. adding content).`,
      },
      {
        role: "user",
        content: `Agent findings:\n${JSON.stringify(findings, null, 2)}`,
      },
    ],
    synthesiserLlmSchema,
  );

  return {
    root_cause: result?.root_cause ?? "Under investigation",
    root_cause_confidence: result?.root_cause_confidence ?? 70,
    actions: result?.actions ?? [],
  };
}
