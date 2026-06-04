import { type NextRequest, NextResponse } from "next/server";
import { captureRecoveryBaseline } from "@/lib/detection/recover";
import {
  approveIncidentActions,
  getIncident,
  listLowRiskProposedActionIds,
} from "@/lib/incidents";
import { approveIncidentBodySchema } from "@/lib/incidents/schemas";
import { sendIncidentNotification } from "@/lib/slack";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const raw = await req.json().catch(() => ({}));
  const parsed = approveIncidentBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const body = parsed.data;
  const approvedBy = body.approved_by ?? "operator";

  const lowRiskIds = body.approve_all_low_risk
    ? await listLowRiskProposedActionIds(supabase, params.id)
    : [];

  const actionIds = [...(body.action_ids ?? []), ...lowRiskIds];

  if (actionIds.length === 0) {
    return NextResponse.json({ error: "No actions to approve" }, { status: 400 });
  }

  try {
    await approveIncidentActions(supabase, params.id, actionIds, approvedBy);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const incident = await getIncident(supabase, params.id);
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

    if (incident.affected_product) {
      await captureRecoveryBaseline(
        supabase,
        params.id,
        incident.affected_product,
        incident.affected_kpis,
      );
    }
  }

  return NextResponse.json({ success: true, approved: actionIds.length });
}
