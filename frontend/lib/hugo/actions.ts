import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Incident } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import type { Database, Json } from "@/lib/supabase/database.types";

import { investigateIncident } from "./investigate-incident";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function incidentLink(id: string): string {
  return `${appUrl()}/incidents/${id}`;
}

/**
 * Run the AI investigation for an incident and return a Slack-ready summary.
 * Requires an affected product (the investigation is product-scoped).
 */
export async function runHugoInvestigation(
  supabase: SupabaseClient<Database>,
  incident: Incident,
): Promise<string> {
  if (!incident.product_id) {
    return `I can't investigate "${incident.title}" — it has no affected product set, which the investigation needs.`;
  }

  try {
    const { result, findings_count, actions_count } = await investigateIncident(
      supabase,
      incident.id,
      incident.product_id,
    );

    const confidence =
      result.root_cause_confidence != null
        ? ` (confidence ${Math.round(result.root_cause_confidence * 100)}%)`
        : "";

    return [
      `Investigation complete for "${incident.title}".`,
      `Root cause${confidence}: ${result.root_cause ?? "inconclusive"}`,
      `Found ${findings_count} finding(s) and proposed ${actions_count} fix action(s).`,
      `Review and approve here: ${incidentLink(incident.id)}`,
    ].join("\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return `Investigation for "${incident.title}" failed: ${message}`;
  }
}

/**
 * Approve the low-risk proposed actions for an incident and return a Slack-ready
 * summary. Posts the recovery/monitoring notification card as a side effect, to
 * match the behaviour of the in-app and button-based approval flows.
 */
export async function runHugoApproval(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  approvedBy: string,
): Promise<string> {
  const actionIds = await getStore(supabase).incidents.listActionIds({
    incidentId: incident.id,
    organizationId: incident.organization_id,
    filter: { status: "proposed", riskLevel: "low" },
  });
  if (actionIds.length === 0) {
    return `There are no low-risk actions awaiting approval on "${incident.title}". You may need to investigate it first, or approve higher-risk actions in the app: ${incidentLink(incident.id)}`;
  }

  try {
    await getStore(supabase).incidents.approveAndNotify({
      incidentId: incident.id,
      actionIds,
      approvedByUserId: approvedBy,
      organizationId: incident.organization_id,
      appUrl: appUrl(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return `Approval for "${incident.title}" failed: ${message}`;
  }

  return [
    `Approved ${actionIds.length} low-risk action(s) for "${incident.title}".`,
    `The fix is deploying and the incident is now in monitoring.`,
    `Track recovery here: ${incidentLink(incident.id)}`,
  ].join("\n");
}

type HugoActionMetadata = { [key: string]: Json | undefined };
type HugoActionActor = HugoActionMetadata & { slack_user?: string };

async function addTimelineNote(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  description: string,
  metadata: HugoActionMetadata,
): Promise<void> {
  await supabase.from("incident_timeline").insert({
    incident_id: incident.id,
    organization_id: incident.organization_id,
    event_type: "monitoring",
    description,
    metadata,
  });
}

export async function runHugoResolve(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  actor: HugoActionActor,
): Promise<string> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("incidents")
    .update({ status: "resolved", resolved_at: now })
    .eq("id", incident.id)
    .eq("organization_id", incident.organization_id);

  if (error) return `Resolve failed for "${incident.title}": ${error.message}`;

  await supabase.from("incident_timeline").insert({
    incident_id: incident.id,
    organization_id: incident.organization_id,
    event_type: "resolved",
    description: `Resolved from Slack by ${actor.slack_user ?? "slack-user"}`,
    metadata: { ...actor },
  });

  return `Resolved "${incident.title}". Track it here: ${incidentLink(incident.id)}`;
}

export async function runHugoReopen(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  actor: HugoActionActor,
): Promise<string> {
  const { error } = await supabase
    .from("incidents")
    .update({ status: "detected", resolved_at: null })
    .eq("id", incident.id)
    .eq("organization_id", incident.organization_id);

  if (error) return `Reopen failed for "${incident.title}": ${error.message}`;

  await addTimelineNote(supabase, incident, `Reopened from Slack by ${actor.slack_user ?? "slack-user"}`, actor);
  return `Reopened "${incident.title}" and moved it back to detected. Track it here: ${incidentLink(incident.id)}`;
}

export async function runHugoSnooze(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  days: number,
  actor: HugoActionActor,
): Promise<string> {
  const safeDays = Math.max(1, Math.min(90, Math.round(days)));
  const until = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString();

  await addTimelineNote(supabase, incident, `Snoozed from Slack for ${safeDays} day(s)`, {
    ...actor,
    snoozed_until: until,
    duration_days: safeDays,
  });

  return `Noted a ${safeDays}-day snooze for "${incident.title}" until ${until.slice(0, 10)}. Track it here: ${incidentLink(incident.id)}`;
}

export async function runHugoRejectProposedActions(
  supabase: SupabaseClient<Database>,
  incident: Incident,
  actor: HugoActionActor,
): Promise<string> {
  const { data: actions, error: listError } = await supabase
    .from("incident_actions")
    .select("id")
    .eq("incident_id", incident.id)
    .eq("organization_id", incident.organization_id)
    .eq("status", "proposed");

  if (listError) return `Reject failed for "${incident.title}": ${listError.message}`;

  const actionIds = (actions ?? []).map((action) => action.id);
  if (actionIds.length === 0) {
    return `There are no proposed fixes to reject for "${incident.title}".`;
  }

  const { error } = await supabase
    .from("incident_actions")
    .update({ status: "rejected" })
    .in("id", actionIds)
    .eq("organization_id", incident.organization_id);

  if (error) return `Reject failed for "${incident.title}": ${error.message}`;

  await addTimelineNote(supabase, incident, `${actionIds.length} proposed action(s) rejected from Slack`, {
    ...actor,
    action_ids: actionIds,
  });

  return `Rejected ${actionIds.length} proposed fix action(s) for "${incident.title}". Track it here: ${incidentLink(incident.id)}`;
}
