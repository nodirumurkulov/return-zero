import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function listLowRiskProposedActionIds(
  supabase: SupabaseClient<Database>,
  incidentId: string,
  organizationId?: string,
): Promise<string[]> {
  const query = supabase
    .from("incident_actions")
    .select("id")
    .eq("incident_id", incidentId)
    .eq("status", "proposed")
    .eq("risk_level", "low");

  const { data } = organizationId
    ? await query.eq("organization_id", organizationId)
    : await query;

  return (data ?? []).map((row) => row.id);
}

export async function approveIncidentActions(
  supabase: SupabaseClient<Database>,
  incidentId: string,
  actionIds: string[],
  approvedByUserId: string | null,
  extraMetadata?: Record<string, unknown>,
): Promise<{ approved: number }> {
  if (actionIds.length === 0) {
    return { approved: 0 };
  }

  const { data: incident, error: incidentErr } = await supabase
    .from("incidents")
    .select("organization_id")
    .eq("id", incidentId)
    .single();

  if (incidentErr || !incident) {
    throw new Error(incidentErr?.message ?? "Incident not found");
  }

  const organizationId = incident.organization_id;
  const now = new Date().toISOString();

  const { error: actionErr } = await supabase
    .from("incident_actions")
    .update({ status: "approved", approved_by_user_id: approvedByUserId, approved_at: now })
    .in("id", actionIds)
    .eq("organization_id", organizationId);

  if (actionErr) throw new Error(actionErr.message);

  await supabase
    .from("incidents")
    .update({ status: "deploying" })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);

  await supabase.from("incident_timeline").insert({
    incident_id: incidentId,
    organization_id: organizationId,
    event_type: "approved",
    description: `${actionIds.length} action(s) approved`,
    metadata: {
      action_ids: actionIds,
      approved_by_user_id: approvedByUserId,
      ...extraMetadata,
    },
  });

  await supabase
    .from("incident_actions")
    .update({ status: "deployed", deployed_at: now })
    .in("id", actionIds)
    .eq("organization_id", organizationId);

  await supabase
    .from("incidents")
    .update({ status: "monitoring" })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);

  await supabase.from("incident_timeline").insert({
    incident_id: incidentId,
    organization_id: organizationId,
    event_type: "deployed",
    description: "Actions deployed — incident now in monitoring",
  });

  return { approved: actionIds.length };
}
