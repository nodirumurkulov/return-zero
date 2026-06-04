import { type NextRequest, NextResponse } from "next/server";
import { approveIncidentActions, listLowRiskProposedActionIds } from "@/lib/incidents";
import { parseSlackInteractionPayload, verifySlackRequest } from "@/lib/slack";
import { createServiceClient } from "@/lib/supabase/server";

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

  const supabase = createServiceClient();
  const params = new URLSearchParams(body);
  const rawPayload = params.get("payload");

  if (!rawPayload) {
    return NextResponse.json({ error: "No payload" }, { status: 400 });
  }

  const payload = parseSlackInteractionPayload(rawPayload);
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = payload.actions?.[0];
  if (!action) {
    return NextResponse.json({ ok: true });
  }

  const incidentId = action.value;
  const approvedBy = payload.user?.name ?? "slack-user";

  if (action.action_id === "approve_low_risk") {
    const actionIds = await listLowRiskProposedActionIds(supabase, incidentId);
    if (actionIds.length > 0) {
      try {
        await approveIncidentActions(supabase, incidentId, actionIds, approvedBy);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
