import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { persistInvestigation } from "@/lib/agents";
import type { Incident } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";

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
  supabase: SupabaseClient,
  incident: Incident,
): Promise<string> {
  if (!incident.product_id) {
    return `I can't investigate "${incident.title}" — it has no affected product set, which the investigation needs.`;
  }

  try {
    const { result, findings_count, actions_count } = await persistInvestigation(
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
  supabase: SupabaseClient,
  incident: Incident,
  approvedBy: string,
): Promise<string> {
  const store = getStore(supabase);
  const actionIds = await store.incidents.listActions({
    incidentId: incident.id,
    organizationId: incident.organization_id,
    filter: { status: "proposed", riskLevel: "low" },
  });
  if (actionIds.length === 0) {
    return `There are no low-risk actions awaiting approval on "${incident.title}". You may need to investigate it first, or approve higher-risk actions in the app: ${incidentLink(incident.id)}`;
  }

  try {
    await store.incidents.approveAndNotify({
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
