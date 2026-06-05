import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { approveIncidentBodySchema, createIncidents } from "@/lib/stores/incidents";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

  const params = await props.params;
  const raw = await req.json().catch(() => ({}));
  const parsed = approveIncidentBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const store = createIncidents(supabase);
  const body = parsed.data;
  const lowRiskIds = body.approve_all_low_risk
    ? await store.listLowRiskProposedActionIds(params.id, organizationId)
    : [];

  const actionIds = [...(body.action_ids ?? []), ...lowRiskIds];

  if (actionIds.length === 0) {
    return NextResponse.json({ error: "No actions to approve" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await store.completeApproval({
      incidentId: params.id,
      actionIds,
      approvedByUserId: user.id,
      organizationId,
      appUrl,
    });
  } catch (err) {
    logApiError("api/incidents/[id]/approve", err);
    return apiErrorResponse(err);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${params.id}`);

  return NextResponse.json({ success: true, approved: actionIds.length });
}
