import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentFinding } from "@/lib/incidents/agent-finding";
import type { Incident } from "@/lib/incidents/incident";
import type { IncidentAction } from "@/lib/incidents/incident-action";
import type { IncidentDetail } from "@/lib/incidents/incident-detail";
import type { UpdateIncidentBody } from "@/lib/incidents/schemas";
import type { TimelineEvent } from "@/lib/incidents/timeline-event";
import { getCurrentOrganizationId } from "@/lib/organizations/queries";
import type { Database } from "@/lib/supabase/database.types";

export type { IncidentDetail } from "@/lib/incidents/incident-detail";

async function resolveOrganizationId(
  supabase: SupabaseClient<Database>,
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
  supabase: SupabaseClient<Database>,
  organizationId?: string,
): Promise<Incident[]> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(
    supabase.from("incidents").select("*").order("created_at", { ascending: false }),
    orgId,
  );

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listIncidentsForProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  organizationId?: string,
): Promise<Incident[]> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(
    supabase
      .from("incidents")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
    orgId,
  );

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getIncident(
  supabase: SupabaseClient<Database>,
  id: string,
  organizationId?: string,
): Promise<Incident | null> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(supabase.from("incidents").select("*").eq("id", id), orgId);

  const { data, error } = await query.single();
  if (error || !data) return null;
  return data;
}

export async function getIncidentDetail(
  supabase: SupabaseClient<Database>,
  id: string,
  organizationId?: string,
): Promise<IncidentDetail | null> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const incidentQuery = withOrgFilter(
    supabase.from("incidents").select("*").eq("id", id),
    orgId,
  );

  const childFilter = orgId
    ? (table: "agent_findings" | "incident_actions" | "incident_timeline") =>
        supabase.from(table).select("*").eq("incident_id", id).eq("organization_id", orgId)
    : (table: "agent_findings" | "incident_actions" | "incident_timeline") =>
        supabase.from(table).select("*").eq("incident_id", id);

  const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
    incidentQuery.single(),
    childFilter("agent_findings").order("created_at", { ascending: true }),
    childFilter("incident_actions").order("created_at", { ascending: true }),
    childFilter("incident_timeline").order("created_at", { ascending: true }),
  ]);

  if (incidentRes.error) return null;

  return {
    incident: incidentRes.data,
    findings: (findingsRes.data ?? []) as AgentFinding[],
    actions: (actionsRes.data ?? []) as IncidentAction[],
    timeline: (timelineRes.data ?? []) as TimelineEvent[],
  };
}

export async function patchIncident(
  supabase: SupabaseClient<Database>,
  id: string,
  patch: UpdateIncidentBody,
  organizationId?: string,
): Promise<Incident> {
  const orgId = await resolveOrganizationId(supabase, organizationId);
  const query = withOrgFilter(supabase.from("incidents").update(patch).eq("id", id), orgId);

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data;
}
