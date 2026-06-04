import type { SupabaseClient } from "@supabase/supabase-js";

export async function listLowRiskProposedActionIds(
  supabase: SupabaseClient,
  incidentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("incident_actions")
    .select("id")
    .eq("incident_id", incidentId)
    .eq("status", "proposed")
    .eq("risk_level", "low");

  return (data ?? []).map((row) => row.id as string);
}

export async function approveIncidentActions(
  supabase: SupabaseClient,
  incidentId: string,
  actionIds: string[],
  approvedBy: string,
): Promise<{ approved: number }> {
  if (actionIds.length === 0) {
    return { approved: 0 };
  }

  const now = new Date().toISOString();

  const { error: actionErr } = await supabase
    .from("incident_actions")
    .update({ status: "approved", approved_by: approvedBy, approved_at: now })
    .in("id", actionIds);

  if (actionErr) throw new Error(actionErr.message);

  await supabase.from("incidents").update({ status: "deploying" }).eq("id", incidentId);

  await supabase.from("incident_timeline").insert({
    incident_id: incidentId,
    event_type: "approved",
    description: `${actionIds.length} action(s) approved by ${approvedBy}`,
    metadata: { action_ids: actionIds, approved_by: approvedBy },
  });

  await supabase
    .from("incident_actions")
    .update({ status: "deployed", deployed_at: now })
    .in("id", actionIds);

  await supabase.from("incidents").update({ status: "monitoring" }).eq("id", incidentId);

  await supabase.from("incident_timeline").insert({
    incident_id: incidentId,
    event_type: "deployed",
    description: "Actions deployed — incident now in monitoring",
  });

  return { approved: actionIds.length };
}
