import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { approveIncidentBodySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) {
    logApiError("api/stores/incidents/[id]/approve", new Error(scopeResult.error));
    return apiErrorResponse(new Error(scopeResult.error), 403);
  }

  const params = await props.params;
  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = approveIncidentBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const scope = scopeResult.scope;
  const store = getStore(supabase);
  const lowRiskIds = body.approve_all_low_risk
    ? await store.incidents.listActionIds({
        incidentId: params.id,
        scope,
        filter: { status: "proposed", riskLevel: "low" },
      })
    : [];

  const actionIds = [...(body.action_ids ?? []), ...lowRiskIds];

  if (actionIds.length === 0) {
    return NextResponse.json({ error: "No actions to approve" }, { status: 400 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await store.incidents.approveAndNotify({
      incidentId: params.id,
      actionIds,
      approvedByUserId: user.id,
      scope,
      appUrl,
    });
  } catch (err) {
    logApiError("api/stores/incidents/[id]/approve", err);
    return apiErrorResponse(err);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${params.id}`);

  return NextResponse.json({ success: true, approved: actionIds.length });
}
