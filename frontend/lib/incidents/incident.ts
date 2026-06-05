/** Incident row — matches Supabase `incidents` table columns. */
export type Incident = {
  id: string;
  organization_id: string;
  title: string;
  status: string;
  severity: string;
  impact_amount: number | null;
  impact_label: string | null;
  product_id: string | null;
  affected_kpi_keys: string[];
  root_cause: string | null;
  root_cause_confidence: number | null;
  monitoring_kpi: string | null;
  baseline_value: number | null;
  target_value: number | null;
  recovery_pct: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  investigation_started_at: string | null;
  fix_proposed_at: string | null;
  monitoring_started_at: string | null;
};

export type IncidentRef = {
  readonly id: string;
};
