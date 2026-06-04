import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentFinding, Incident, IncidentAction, TimelineEvent } from "./types";

export async function listIncidents(supabase: SupabaseClient): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Incident[];
}

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};

export async function getIncident(
  supabase: SupabaseClient,
  id: string,
): Promise<Incident | null> {
  const { data, error } = await supabase.from("incidents").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as Incident;
}

export async function getIncidentDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<IncidentDetail | null> {
  const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
    supabase.from("incidents").select("*").eq("id", id).single(),
    supabase
      .from("agent_findings")
      .select("*")
      .eq("incident_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("incident_actions")
      .select("*")
      .eq("incident_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("incident_timeline")
      .select("*")
      .eq("incident_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (incidentRes.error) return null;

  return {
    incident: incidentRes.data as Incident,
    findings: (findingsRes.data ?? []) as AgentFinding[],
    actions: (actionsRes.data ?? []) as IncidentAction[],
    timeline: (timelineRes.data ?? []) as TimelineEvent[],
  };
}
