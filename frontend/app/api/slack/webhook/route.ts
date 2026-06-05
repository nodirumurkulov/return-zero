import { type NextRequest, NextResponse } from "next/server";
import { resolveOrganizationIdForSlackTeam } from "@/lib/organizations";
import { parseSlackInteractionPayload, verifySlackRequest } from "@/lib/slack";
import { getStore } from "@/lib/stores/server";
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

  if (action.action_id === "approve_low_risk") {
    const store = getStore(supabase);
    const incident = await store.incidents.get({ id: incidentId, organizationId });
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const actionIds = await store.incidents.listActions({
      incidentId,
      organizationId,
      filter: { status: "proposed", riskLevel: "low" },
    });
    if (actionIds.length > 0) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        await store.incidents.approveAndNotify({
          incidentId,
          actionIds,
          approvedByUserId: null,
          organizationId,
          appUrl,
          extraMetadata: { slack_user: slackUser },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
