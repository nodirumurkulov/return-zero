import { z } from "zod";

export const investigateBodySchema = z.object({
  incident_id: z.string().min(1),
  product_id: z.string().min(1),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;

export const agentFindingLlmSchema = z.object({
  summary: z.string(),
  detail: z.record(z.string(), z.unknown()),
});

export const synthesiserLlmSchema = z.object({
  root_cause: z.string(),
  root_cause_confidence: z.number(),
  actions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact_level: z.enum(["high", "medium", "low"]),
      risk_level: z.enum(["high", "medium", "low"]),
      auto_deploy: z.boolean(),
    }),
  ),
});
