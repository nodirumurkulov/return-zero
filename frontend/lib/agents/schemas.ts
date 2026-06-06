import { z } from "zod";

export const investigateBodySchema = z.object({
  incident_id: z.uuid(),
  product_id: z.uuid(),
});

export type InvestigateBody = z.infer<typeof investigateBodySchema>;

export const investigationStepsResponseSchema = z
  .object({
    run_id: z.uuid().nullable(),
    run_status: z.enum(["idle", "running", "complete", "error"]),
    steps: z.array(
      z.object({
        id: z.uuid(),
        step_key: z.string(),
        agent_name: z.string(),
        label: z.string(),
        status: z.enum(["running", "done", "error"]),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    ),
  })
  .strict();

export type InvestigationStepsResponse = z.infer<typeof investigationStepsResponseSchema>;

export const investigateResponseSchema = z
  .object({
    success: z.literal(true),
    root_cause: z.string(),
    root_cause_confidence: z.number(),
    findings_count: z.number(),
    actions_count: z.number(),
    run_id: z.uuid(),
  })
  .strict();

export type InvestigateResponse = z.infer<typeof investigateResponseSchema>;

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
