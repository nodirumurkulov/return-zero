import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/slack/webhook
 * Handles Slack interactive component callbacks (button clicks).
 * Slack sends application/x-www-form-urlencoded with a `payload` field.
 */
export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  const body = await req.text();
  const params = new URLSearchParams(body);
  const rawPayload = params.get("payload");

  if (!rawPayload) {
    return NextResponse.json({ error: "No payload" }, { status: 400 });
  }

  type SlackPayload = {
    actions?: Array<{ action_id: string; value: string }>;
    user?: { name: string };
  };

  const payload: SlackPayload | null = (() => {
    try {
      return JSON.parse(rawPayload) as SlackPayload;
    } catch {
      return null;
    }
  })();

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
    // Approve all proposed low-risk actions
    const now = new Date().toISOString();

    const { data: lowRiskActions } = await supabase
      .from("incident_actions")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("status", "proposed")
      .eq("risk_level", "low");

    const ids = lowRiskActions?.map((a) => a.id) ?? [];

    if (ids.length > 0) {
      await supabase.from("incident_actions").update({
        status: "approved",
        approved_by: approvedBy,
        approved_at: now,
      }).in("id", ids);

      await supabase.from("incidents").update({ status: "deploying" }).eq("id", incidentId);

      await supabase.from("incident_timeline").insert({
        incident_id: incidentId,
        event_type: "approved",
        description: `${ids.length} low-risk action(s) approved via Slack by @${approvedBy}`,
        metadata: { source: "slack", action_ids: ids },
      });

      // Simulate deploy
      await supabase.from("incident_actions").update({
        status: "deployed",
        deployed_at: now,
      }).in("id", ids);

      await supabase.from("incidents").update({ status: "monitoring" }).eq("id", incidentId);

      await supabase.from("incident_timeline").insert({
        incident_id: incidentId,
        event_type: "deployed",
        description: "Actions deployed — incident now in monitoring",
      });
    }
  }

  // Slack expects a 200 with an empty body or message update
  return new NextResponse(null, { status: 200 });
}
