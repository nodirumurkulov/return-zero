/** Incident action row — matches Supabase `incident_actions` table columns. */
export type IncidentAction = {
  id: string;
  organization_id: string;
  incident_id: string;
  title: string;
  description: string | null;
  impact_level: string;
  risk_level: string;
  auto_deploy: boolean;
  status: string;
  approved_by_user_id: string | null;
  approved_at: string | null;
  deployed_at: string | null;
  created_at: string;
};
