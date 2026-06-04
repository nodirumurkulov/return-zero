import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFinding } from "@/lib/incidents/agent-finding";
import type { Incident } from "@/lib/incidents/incident";
import type { IncidentAction } from "@/lib/incidents/incident-action";
import type { IncidentDetail } from "@/lib/incidents/incident-detail";
import type { TimelineEvent } from "@/lib/incidents/timeline-event";

export type { IncidentDetail } from "@/lib/incidents/incident-detail";

export async function listIncidents(supabase: SupabaseClient): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Incident[];
}

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
