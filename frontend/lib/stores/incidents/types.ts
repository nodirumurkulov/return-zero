import { z } from "zod";

import { Constants, type Database } from "@/lib/supabase/database.types";

export const INCIDENT_STATUSES = Constants.public.Enums.incident_status;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SEVERITIES = Constants.public.Enums.incident_severity;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const TERMINAL_INCIDENT_STATUSES = ["resolved", "canceled"] as const;

export function isIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value);
}

export const KANBAN_STATUSES = [
  "detected",
  "investigating",
  "fix_proposed",
  "awaiting_approval",
  "monitoring",
  "resolved",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const KANBAN_COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "detected", label: "Detected" },
  { status: "investigating", label: "Investigating" },
  { status: "fix_proposed", label: "Fix Proposed" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "monitoring", label: "Monitoring" },
  { status: "resolved", label: "Resolved" },
];

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

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentAction = Database["public"]["Tables"]["incident_actions"]["Row"];
export type AgentFinding = Database["public"]["Tables"]["agent_findings"]["Row"];
export type TimelineEvent = Database["public"]["Tables"]["incident_timeline"]["Row"];

export type IncidentRef = {
  readonly id: string;
};

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};

export type ApproveActionsInput = {
  incidentId: string;
  actionIds: string[];
  approvedByUserId: string | null;
  extraMetadata?: Record<string, unknown>;
};

export type IncidentsListOpts = {
  organizationId: string;
};

export type IncidentsGetOpts = {
  id: string;
  organizationId: string;
};

export type IncidentsUpdateOpts = {
  id: string;
  organizationId: string;
  patch: UpdateIncidentBody;
};

export type ListIncidentActionIdsOpts = {
  incidentId: string;
  organizationId: string;
  filter?: {
    status?: IncidentAction["status"];
    riskLevel?: NonNullable<IncidentAction["risk_level"]>;
  };
};

export type ApproveIncidentAndNotifyOpts = ApproveActionsInput & {
  organizationId: string;
  appUrl: string;
};

export type CreatedIncident = {
  incident_id: string;
  product_id: string;
  title: string;
  severity: string;
  affected_kpi_keys: string[];
  impact_amount: number;
  impact_label: string | null;
};

export type DetectionResult = {
  scanned: number;
  created: CreatedIncident[];
  skipped: { product_id: string; reason: string }[];
};

export function mergeDetectionResults(results: readonly DetectionResult[]): DetectionResult {
  return results.reduce(
    (acc, r) => ({
      scanned: acc.scanned + r.scanned,
      created: [...acc.created, ...r.created],
      skipped: [...acc.skipped, ...r.skipped],
    }),
    { scanned: 0, created: [], skipped: [] } satisfies DetectionResult,
  );
}

export type DetectOpts = {
  organizationId: string;
  productId: string;
  asOf?: string;
};

export const detectBodySchema = z.object({
  product_id: z.string().uuid().optional(),
  as_of: z.string().optional(),
});

export type DetectBody = z.infer<typeof detectBodySchema>;
