import { z } from "zod";

export const investigateBodySchema = z.object({
  incident_id: z.uuid(),
  product_id: z.uuid(),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;

export const hugoFindingSchema = z.object({
  agent_name: z.string(),
  agent_icon: z.string(),
  summary: z.string(),
  detail: z.record(z.string(), z.unknown()),
});

export const hugoActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact_level: z.enum(["high", "medium", "low"]),
  risk_level: z.enum(["high", "medium", "low"]),
  auto_deploy: z.boolean(),
});

export const persistInvestigationInputSchema = z.object({
  incidentId: z.uuid(),
  findings: z.array(hugoFindingSchema).min(1),
  root_cause: z.string(),
  root_cause_confidence: z.number().min(0).max(100),
  actions: z.array(hugoActionSchema),
});

export const finalResponseInputSchema = z.object({
  message: z.string().min(1),
});

export const resolveReferenceInputSchema = z.object({
  reference: z.string().nullable().optional(),
});

export const productIdInputSchema = z.object({
  productId: z.uuid(),
});

export const incidentIdInputSchema = z.object({
  incidentId: z.uuid(),
});
