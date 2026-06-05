import { z } from "zod";
import { INCIDENT_STATUSES } from "./status";

export const updateIncidentBodySchema = z
  .object({
    title: z.string().min(1),
    status: z.enum(INCIDENT_STATUSES),
    severity: z.string().min(1),
    impact_amount: z.number().nullable(),
    impact_label: z.string().nullable(),
    affected_product: z.string().nullable(),
    affected_kpis: z.array(z.string()).nullable(),
    root_cause: z.string().nullable(),
    root_cause_confidence: z.number().nullable(),
    resolved_at: z.string().nullable(),
    monitoring_kpi: z.string().nullable(),
    baseline_value: z.number().nullable(),
    target_value: z.number().nullable(),
    recovery_pct: z.number(),
  })
  .partial()
  .strict();

export type UpdateIncidentBody = z.infer<typeof updateIncidentBodySchema>;

export const approveIncidentBodySchema = z.object({
  action_ids: z.array(z.string().min(1)).optional(),
  approve_all_low_risk: z.boolean().optional(),
});

export type ApproveIncidentBody = z.infer<typeof approveIncidentBodySchema>;
