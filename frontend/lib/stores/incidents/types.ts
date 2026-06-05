import type { Database } from "@/lib/supabase/database.types";

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
