import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { investigateBodySchema } from "@/lib/agents";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { investigateIncident } from "@/lib/hugo/investigate-incident";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const raw: unknown = await req.json().catch(() => null);
  const parsed = investigateBodySchema.safeParse(raw);
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

  const { incident_id, product_id } = parsed.data;

  try {
    const scopeResult = await tryGetStoreScope(supabase);
    if (!scopeResult.ok) {
      return NextResponse.json({ error: scopeResult.error }, { status: 403 });
    }

    const scope = scopeResult.scope;
    const incident = await getStore(supabase).incidents.get({
      id: incident_id,
      scope,
    });
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const resolvedProductId = incident.product_id ?? product_id;
    if (!resolvedProductId) {
      return NextResponse.json({ error: "Incident has no product" }, { status: 400 });
    }

    const { result, findings_count, actions_count, run_id } = await investigateIncident(
      supabase,
      incident_id,
      resolvedProductId,
    );

    revalidatePath("/incidents");
    revalidatePath(`/incidents/${incident_id}`);

    return NextResponse.json({
      success: true,
      root_cause: result.root_cause,
      root_cause_confidence: result.root_cause_confidence,
      findings_count,
      actions_count,
      run_id,
    });
  } catch (err) {
    logApiError("api/investigate", err);
    await supabase.from("incidents").update({ status: "detected" }).eq("id", incident_id);
    return apiErrorResponse(err);
  }
}
