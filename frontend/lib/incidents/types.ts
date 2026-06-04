import type {
  AgentFindingRow,
  IncidentActionRow,
  IncidentRow,
  Json,
  TimelineEventRow,
} from "./db";

export type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  impact_amount: number | null;
  impact_label: string | null;
  root_cause: string | null;
  root_cause_confidence: number | null;
  created_at: string;
  affected_product: string | null;
  affected_kpis: string[] | null;
  monitoring_kpi?: string | null;
  baseline_value?: number | null;
  target_value?: number | null;
  recovery_pct?: number | null;
};

export type IncidentAction = {
  id: string;
  title: string;
  description?: string;
  impact_level: string;
  risk_level: string;
  auto_deploy: boolean;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  deployed_at?: string | null;
};

export type AgentFinding = {
  id: string;
  agent_name: string;
  agent_icon?: string;
  summary: string;
  detail?: Record<string, unknown>;
  created_at: string;
};

export type TimelineEvent = {
  id: string;
  event_type: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

function jsonToStringArray(value: Json | null): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string");
}

function jsonToRecord(value: Json | null): Record<string, unknown> | undefined {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value;
}

export function fromIncidentRow(row: IncidentRow): Incident {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    severity: row.severity,
    impact_amount: row.impact_amount,
    impact_label: row.impact_label,
    root_cause: row.root_cause,
    root_cause_confidence: row.root_cause_confidence,
    created_at: row.created_at,
    affected_product: row.affected_product,
    affected_kpis: jsonToStringArray(row.affected_kpis),
    monitoring_kpi: row.monitoring_kpi,
    baseline_value: row.baseline_value,
    target_value: row.target_value,
    recovery_pct: row.recovery_pct,
  };
}

export function fromIncidentActionRow(row: IncidentActionRow): IncidentAction {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    impact_level: row.impact_level,
    risk_level: row.risk_level,
    auto_deploy: row.auto_deploy,
    status: row.status,
    approved_by: row.approved_by,
    approved_at: row.approved_at,
    deployed_at: row.deployed_at,
  };
}

export function fromAgentFindingRow(row: AgentFindingRow): AgentFinding {
  return {
    id: row.id,
    agent_name: row.agent_name,
    agent_icon: row.agent_icon ?? undefined,
    summary: row.summary,
    detail: jsonToRecord(row.detail),
    created_at: row.created_at,
  };
}

export function fromTimelineEventRow(row: TimelineEventRow): TimelineEvent {
  return {
    id: row.id,
    event_type: row.event_type,
    description: row.description,
    metadata: jsonToRecord(row.metadata),
    created_at: row.created_at,
  };
}
