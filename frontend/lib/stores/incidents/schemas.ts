import { z } from "zod";

import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "./status";

export const approveIncidentBodySchema = z.object({
  action_ids: z.array(z.string().min(1)).optional(),
  approve_all_low_risk: z.boolean().optional(),
});

export type ApproveIncidentBody = z.infer<typeof approveIncidentBodySchema>;

export const updateIncidentBodySchema = z
  .object({
    title: z.string().min(1),
    status: z.enum(INCIDENT_STATUSES),
    severity: z.enum(INCIDENT_SEVERITIES),
    impact_amount: z.number().nullable(),
    impact_label: z.string().nullable(),
    product_id: z.string().uuid().nullable(),
    affected_kpi_keys: z.array(z.string()).optional(),
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

export const patchIncidentStatusBodySchema = z
  .object({
    status: z.enum(INCIDENT_STATUSES),
    resolved_at: z.string().nullable().optional(),
  })
  .strict();

export type PatchIncidentStatusBody = z.infer<typeof patchIncidentStatusBodySchema>;

export const approveIncidentResponseSchema = z
  .object({
    success: z.literal(true),
    approved: z.number(),
  })
  .strict();

export type ApproveIncidentResponse = z.infer<typeof approveIncidentResponseSchema>;

const incidentRowSchema = z.record(z.string(), z.unknown());

export const incidentDetailSchema = z
  .object({
    incident: incidentRowSchema,
    findings: z.array(incidentRowSchema),
    actions: z.array(incidentRowSchema),
    timeline: z.array(incidentRowSchema),
  })
  .strict();
