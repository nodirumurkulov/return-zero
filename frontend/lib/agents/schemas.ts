import { z } from "zod";

export const investigateBodySchema = z.object({
  incident_id: z.uuid(),
  product_id: z.uuid(),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;

// ── Quant Analyst → Operator pipeline ──────────────────────────────────────
// All numeric stat fields are nullable + optional: gpt-5.5 JSON-mode is happier
// emitting null than omitting, and a finding may legitimately have no z/σ (no
// baseline) or no quantity (a non-inventory dimension).

export const confidenceEnum = z.enum(["high", "moderate", "low", "none"]);

const confidenceIntervalSchema = z
  .object({ lower: z.number(), upper: z.number() })
  .nullable()
  .optional();

/** One dimension of the quant diagnosis. Stats ride in fields + the free detail. */
export const quantFindingSchema = z.object({
  agent_name: z.string(),
  agent_icon: z.string(),
  summary: z.string(),
  z_score: z.number().nullable().optional(),
  sigma: z.number().nullable().optional(),
  ci: confidenceIntervalSchema,
  confidence: confidenceEnum.nullable().optional(),
  quantity: z.number().nullable().optional(),
  detail: z.record(z.string(), z.unknown()),
});

export const quantDiagnosisSchema = z.object({
  findings: z.array(quantFindingSchema),
});

/** A costed, goal-aligned recommendation from the Operator. */
export const operatorActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact_level: z.enum(["high", "medium", "low"]),
  risk_level: z.enum(["high", "medium", "low"]),
  auto_deploy: z.boolean(),
  goal_rationale: z.string().nullable().optional(),
  estimated_impact_gbp: z.number().nullable().optional(),
  confidence: confidenceEnum.nullable().optional(),
});

export const operatorOutputSchema = z.object({
  root_cause: z.string(),
  root_cause_confidence: z.number(),
  actions: z.array(operatorActionSchema),
});
