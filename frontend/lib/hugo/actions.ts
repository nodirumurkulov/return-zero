import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { persistInvestigation } from "@/lib/agents";
import { captureRecoveryBaseline } from "@/lib/detection/recover";
import {
  approveIncidentActions,
  getIncident,
  type Incident,
  listLowRiskProposedActionIds,
} from "@/lib/incidents";
import { sendIncidentNotification } from "@/lib/slack";

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
  if (!incident.affected_product) {
    return `I can't investigate "${incident.title}" — it has no affected product set, which the investigation needs.`;
  }

  try {
    const { result, findings_count, actions_count } = await persistInvestigation(
      supabase,
      incident.id,
      incident.affected_product,
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
  const actionIds = await listLowRiskProposedActionIds(supabase, incident.id);
  if (actionIds.length === 0) {
    return `There are no low-risk actions awaiting approval on "${incident.title}". You may need to investigate it first, or approve higher-risk actions in the app: ${incidentLink(incident.id)}`;
  }

  try {
    await approveIncidentActions(supabase, incident.id, actionIds, approvedBy);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return `Approval for "${incident.title}" failed: ${message}`;
  }

  const updated = await getIncident(supabase, incident.id);
  if (updated) {
    if (updated.affected_product) {
      await captureRecoveryBaseline(
        supabase,
        updated.id,
        updated.affected_product,
        updated.affected_kpis,
      );
    }
    await sendIncidentNotification({
      title: updated.title,
      severity: updated.severity,
      status: "monitoring",
      impact_amount: updated.impact_amount,
      impact_label: updated.impact_label,
      root_cause: updated.root_cause,
      root_cause_confidence: updated.root_cause_confidence,
      incident_id: updated.id,
      app_url: appUrl(),
    });
  }

  return [
    `Approved ${actionIds.length} low-risk action(s) for "${incident.title}".`,
    `The fix is deploying and the incident is now in monitoring.`,
    `Track recovery here: ${incidentLink(incident.id)}`,
  ].join("\n");
}
