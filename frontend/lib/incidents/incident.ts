/** Incident row — matches Supabase `incidents` table columns. */
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

export type IncidentRef = {
  readonly id: string;
};
