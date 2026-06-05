import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { updateIncidentBodySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return NextResponse.json({ error: org.error }, { status: 403 });
  }

  const raw: unknown = await req.json().catch(() => null);
  const parsed = updateIncidentBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const data = await getStore(supabase).incidents.update({
      id: params.id,
      organizationId: org.organizationId,
      patch: parsed.data,
    });
    return NextResponse.json(data);
  } catch (err) {
    logApiError("api/stores/incidents/[id] PATCH", err);
    return apiErrorResponse(err);
  }
}
