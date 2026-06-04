import { type NextRequest, NextResponse } from "next/server";
import { captureRecoveryBaseline } from "@/lib/detection/recover";
import { sendIncidentNotification } from "@/lib/slack";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createServiceClient();
  const body = (await req.json()) as {
    action_ids?: string[];   // specific action IDs to approve
    approve_all_low_risk?: boolean;
    approved_by?: string;
  };

  const approvedBy = body.approved_by ?? "operator";
  const now = new Date().toISOString();

  const lowRiskIds = body.approve_all_low_risk
    ? (
        await supabase
          .from("incident_actions")
          .select("id")
          .eq("incident_id", params.id)
          .eq("status", "proposed")
          .eq("risk_level", "low")
      ).data?.map((a) => a.id as string) ?? []
    : [];

  const actionIds = [...(body.action_ids ?? []), ...lowRiskIds];

  if (actionIds.length === 0) {
    return NextResponse.json({ error: "No actions to approve" }, { status: 400 });
  }

  // Approve actions
  const { error: actionErr } = await supabase
    .from("incident_actions")
    .update({ status: "approved", approved_by: approvedBy, approved_at: now })
    .in("id", actionIds);

  if (actionErr) {
    return NextResponse.json({ error: actionErr.message }, { status: 500 });
  }

  // Advance incident to deploying
  await supabase
    .from("incidents")
    .update({ status: "deploying" })
    .eq("id", params.id);

  // Append timeline event
  await supabase.from("incident_timeline").insert({
    incident_id: params.id,
    event_type: "approved",
    description: `${actionIds.length} action(s) approved by ${approvedBy}`,
    metadata: { action_ids: actionIds, approved_by: approvedBy },
  });

  // Simulate deploy: mark approved actions as deployed
  await supabase
    .from("incident_actions")
    .update({ status: "deployed", deployed_at: now })
    .in("id", actionIds);

  // Move incident to monitoring
  await supabase
    .from("incidents")
    .update({ status: "monitoring" })
    .eq("id", params.id);

  await supabase.from("incident_timeline").insert({
    incident_id: params.id,
    event_type: "deployed",
    description: `Actions deployed — incident now in monitoring`,
  });

  // Fetch updated incident for Slack notification
  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (incident) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendIncidentNotification({
      title: incident.title,
      severity: incident.severity,
      status: "monitoring",
      impact_amount: incident.impact_amount,
      impact_label: incident.impact_label,
      root_cause: incident.root_cause,
      root_cause_confidence: incident.root_cause_confidence,
      incident_id: params.id,
      app_url: appUrl,
    });

    // Snapshot the breached KPI so the recovery loop can track it (RUN-22/23).
    if (incident.affected_product) {
      await captureRecoveryBaseline(supabase, params.id, incident.affected_product, incident.affected_kpis ?? null);
    }
  }

  return NextResponse.json({ success: true, approved: actionIds.length });
}
