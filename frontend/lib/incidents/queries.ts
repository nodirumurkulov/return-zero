import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFinding } from "@/lib/incidents/agent-finding";
import type { Incident } from "@/lib/incidents/incident";
import type { IncidentAction } from "@/lib/incidents/incident-action";
import type { IncidentDetail } from "@/lib/incidents/incident-detail";
import type { UpdateIncidentBody } from "@/lib/incidents/schemas";
import type { TimelineEvent } from "@/lib/incidents/timeline-event";
import { getCurrentOrganizationId } from "@/lib/organizations/queries";

export type { IncidentDetail } from "@/lib/incidents/incident-detail";

async function resolveOrganizationId(
  supabase: SupabaseClient,
  organizationId?: string,
): Promise<string | null> {
  return organizationId ?? (await getCurrentOrganizationId(supabase));
}

function withOrgFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  organizationId: string | null,
): T {
  return organizationId ? query.eq("organization_id", organizationId) : query;
}

export async function listIncidents(
  supabase: SupabaseClient,
  organizationId?: string,
): Promise<Incident[]> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(
    supabase.from("incidents").select("*").order("created_at", { ascending: false }),
    orgId,
  );

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Incident[];
}

export async function getIncident(
  supabase: SupabaseClient,
  id: string,
  organizationId?: string,
): Promise<Incident | null> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(supabase.from("incidents").select("*").eq("id", id), orgId);

  const { data, error } = await query.single();
  if (error || !data) return null;
  return data as Incident;
}

export async function getIncidentDetail(
  supabase: SupabaseClient,
  id: string,
  organizationId?: string,
): Promise<IncidentDetail | null> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const incidentQuery = withOrgFilter(
    supabase.from("incidents").select("*").eq("id", id),
    orgId,
  );

  const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
    incidentQuery.single(),
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

export async function patchIncident(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateIncidentBody,
  organizationId?: string,
): Promise<Incident> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(supabase.from("incidents").update(patch).eq("id", id), orgId);

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Incident;
}
