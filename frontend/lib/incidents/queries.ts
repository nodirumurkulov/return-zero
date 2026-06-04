import type { SupabaseClient } from "@supabase/supabase-js";

import type { AgentFindingRow, IncidentActionRow, IncidentRow, TimelineEventRow } from "./db";
import {
  fromAgentFindingRow,
  fromIncidentActionRow,
  fromIncidentRow,
  fromTimelineEventRow,
  type AgentFinding,
  type Incident,
  type IncidentAction,
  type TimelineEvent,
} from "./types";

export async function listIncidents(supabase: SupabaseClient): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as IncidentRow[]).map(fromIncidentRow);
}

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};

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
    incident: fromIncidentRow(incidentRes.data as IncidentRow),
    findings: ((findingsRes.data ?? []) as AgentFindingRow[]).map(fromAgentFindingRow),
    actions: ((actionsRes.data ?? []) as IncidentActionRow[]).map(fromIncidentActionRow),
    timeline: ((timelineRes.data ?? []) as TimelineEventRow[]).map(fromTimelineEventRow),
  };
}
