import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { investigateBodySchema, persistInvestigation } from "@/lib/agents";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { requireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
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
    await requireOrganizationId(supabase);

    const { result, findings_count, actions_count } = await persistInvestigation(
      supabase,
      incident_id,
      product_id,
    );

    revalidatePath("/incidents");
    revalidatePath(`/incidents/${incident_id}`);

    return NextResponse.json({
      success: true,
      root_cause: result.root_cause,
      root_cause_confidence: result.root_cause_confidence,
      findings_count,
      actions_count,
    });
  } catch (err) {
    logApiError("api/investigate", err);
    await supabase.from("incidents").update({ status: "detected" }).eq("id", incident_id);
    return apiErrorResponse(err);
  }
}
