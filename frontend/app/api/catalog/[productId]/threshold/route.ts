import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { updateThresholdBodySchema } from "@/lib/stores/analytics/catalog/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, props: { params: Promise<{ productId: string }> }) {
  const { productId } = await props.params;
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
  const { organizationId } = org;

  const raw = await req.json().catch(() => null);
  const parsed = updateThresholdBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const { metric_key: metricKey, threshold } = parsed.data;

  const { data: metricDef, error: defErr } = await supabase
    .from("metric_definitions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("metric_key", metricKey)
    .maybeSingle();

  if (defErr || !metricDef) {
    return NextResponse.json({ error: defErr?.message ?? "Unknown metric" }, { status: 400 });
  }

  const { error } = await supabase.from("product_kpi_thresholds").upsert(
    {
      organization_id: organizationId,
      product_id: productId,
      metric_definition_id: metricDef.id,
      threshold,
      active: true,
    },
    { onConflict: "organization_id,product_id,metric_definition_id" },
  );

  if (error) {
    logApiError("api/catalog/[productId]/threshold PATCH", error);
    return apiErrorResponse(error);
  }

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
  return NextResponse.json({ ok: true as const });
}
