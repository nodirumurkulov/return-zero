/** Incident domain types — identical to Supabase table/view columns. */
import type { Json } from "@/lib/supabase/database.types";

export type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  impact_amount: number | null;
  impact_label: string | null;
  affected_product: string | null;
  affected_kpis: string[] | null;
  root_cause: string | null;
  root_cause_confidence: number | null;
  created_at: string;
  resolved_at: string | null;
  monitoring_kpi: string | null;
  baseline_value: number | null;
  target_value: number | null;
  recovery_pct: number | null;
};

export type IncidentAction = {
  id: string;
  incident_id: string;
  title: string;
  description: string | null;
  impact_level: string;
  risk_level: string;
  auto_deploy: boolean;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  deployed_at: string | null;
  created_at: string;
};

export type AgentFinding = {
  id: string;
  incident_id: string;
  agent_name: string;
  agent_icon: string | null;
  summary: string;
  detail: Json | null;
  created_at: string;
};

export type TimelineEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  description: string;
  metadata: Json | null;
  created_at: string;
};
