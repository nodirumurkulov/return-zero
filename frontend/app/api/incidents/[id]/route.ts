import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createIncidents, updateIncidentBodySchema } from "@/lib/stores/incidents";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

  const detail = await createIncidents(supabase).getIncidentDetail(params.id, org.organizationId);

  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

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

  const raw = await req.json().catch(() => null);
  const parsed = updateIncidentBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const data = await createIncidents(supabase).patchIncident(
      params.id,
      parsed.data,
      org.organizationId,
    );
    return NextResponse.json(data);
  } catch (err) {
    logApiError("api/incidents/[id] PATCH", err);
    return apiErrorResponse(err);
  }
}
