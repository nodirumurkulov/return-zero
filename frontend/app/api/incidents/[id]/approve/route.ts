import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { sendIncidentNotification } from "@/lib/slack";
import { approveIncidentBodySchema, createIncidents } from "@/lib/stores/incidents";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    logApiError("api/incidents/[id]/approve", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }
  const { organizationId } = org;

  const store = createIncidents(supabase);
  const body = parsed.data;
  const lowRiskIds = body.approve_all_low_risk
    ? await store.listLowRiskProposedActionIds(params.id)
    : [];

  const actionIds = [...(body.action_ids ?? []), ...lowRiskIds];

  if (actionIds.length === 0) {
    return NextResponse.json({ error: "No actions to approve" }, { status: 400 });
  }

  try {
    await store.approveIncidentActions({
      incidentId: params.id,
      actionIds,
      approvedByUserId: user.id,
    });
  } catch (err) {
    logApiError("api/incidents/[id]/approve", err);
    return apiErrorResponse(err);
  }

  const incident = await store.getIncident(params.id);
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

    if (incident.product_id) {
      await store.captureRecoveryBaseline(
        organizationId,
        params.id,
        incident.product_id,
        incident.affected_kpi_keys,
      );
    }
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${params.id}`);

  return NextResponse.json({ success: true, approved: actionIds.length });
}
