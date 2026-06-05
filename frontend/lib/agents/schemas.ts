import { zodSchema } from "ai";
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

export type AgentFindingLlm = z.infer<typeof agentFindingLlmSchema>;

export const agentFindingOutputSchema = zodSchema(agentFindingLlmSchema);

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

export type SynthesiserLlm = z.infer<typeof synthesiserLlmSchema>;

export const synthesiserOutputSchema = zodSchema(synthesiserLlmSchema);

const productIdInputZod = z.object({ productId: z.string() });

export type ProductIdInput = z.infer<typeof productIdInputZod>;

export const productIdInputSchema = zodSchema(productIdInputZod);
