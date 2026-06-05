import { type NextRequest, NextResponse } from "next/server";
import { captureRecoveryBaseline } from "@/lib/detection/recover";
import { runHugoRejectProposedActions, runHugoResolve } from "@/lib/hugo/actions";
import { approveIncidentActions, getIncident, listLowRiskProposedActionIds } from "@/lib/incidents";
import { resolveOrganizationIdForSlackTeam } from "@/lib/organizations";
import { parseSlackInteractionPayload, sendIncidentNotification, verifySlackRequest } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/slack/webhook
 * Handles Slack interactive component callbacks (button clicks).
 * Slack sends application/x-www-form-urlencoded with a `payload` field.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  const verified = verifySlackRequest(body, {
    signature: req.headers.get("x-slack-signature"),
    timestamp: req.headers.get("x-slack-request-timestamp"),
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const params = new URLSearchParams(body);
  const rawPayload = params.get("payload");

  if (!rawPayload) {
    return NextResponse.json({ error: "No payload" }, { status: 400 });
  }

  const payload = parseSlackInteractionPayload(rawPayload);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const organizationId = await resolveOrganizationIdForSlackTeam(supabase, payload.team?.id);
  if (!organizationId) {
    return NextResponse.json(
      { error: "Slack workspace is not linked to an organization" },
      { status: 403 },
    );
  }

  const action = payload.actions?.[0];
  if (!action) {
    return NextResponse.json({ ok: true });
  }

  const incidentId = action.value;
  const slackUser = payload.user?.name ?? "slack-user";

  if (action.action_id === "cancel_hugo_action") {
    return NextResponse.json({ text: "Canceled. No changes were made." });
  }

  if (action.action_id === "confirm_hugo_resolve" || action.action_id === "confirm_hugo_reject") {
    const incident = await getIncident(supabase, incidentId, organizationId);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const result =
      action.action_id === "confirm_hugo_resolve"
        ? await runHugoResolve(supabase, incident, { slack_user: slackUser })
        : await runHugoRejectProposedActions(supabase, incident, { slack_user: slackUser });

    return NextResponse.json({ text: result });
  }

  if (action.action_id === "approve_low_risk") {
    const incident = await getIncident(supabase, incidentId, organizationId);
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const actionIds = await listLowRiskProposedActionIds(supabase, incidentId, organizationId);
    if (actionIds.length > 0) {
      try {
        await approveIncidentActions(supabase, incidentId, actionIds, null, { slack_user: slackUser });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
      }

      if (incident.product_id) {
        await captureRecoveryBaseline(
          supabase,
          incident.organization_id,
          incidentId,
          incident.product_id,
          incident.affected_kpi_keys,
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendIncidentNotification({
        title: incident.title,
        severity: incident.severity,
        status: "monitoring",
        impact_amount: incident.impact_amount,
        impact_label: incident.impact_label,
        root_cause: incident.root_cause,
        root_cause_confidence: incident.root_cause_confidence,
        incident_id: incidentId,
        app_url: appUrl,
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
