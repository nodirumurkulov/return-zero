import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { getRequestIp, logSecurityEvent } from "@/lib/audit";
import { updateThresholdBodySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

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

  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) {
    return NextResponse.json({ error: scopeResult.error }, { status: 403 });
  }
  const scope = scopeResult.scope;

  const raw: unknown = await req.json().catch(() => null);
  const parsed = updateThresholdBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const { metric_key: metricKey, threshold } = parsed.data;

  try {
    await getStore(supabase).catalog.update({
      scope,
      productId,
      metricKey,
      threshold,
    });

    void logSecurityEvent(createAdminClient(), {
      organization_id: scope.organizationId,
      user_id: user.id,
      category: "config_change",
      action: "threshold_updated",
      severity: "medium",
      ip_address: getRequestIp(req),
      user_agent: req.headers.get("user-agent"),
      metadata: { product_id: productId, metric_key: metricKey, threshold },
    });

    revalidatePath(`/catalog/${productId}`);
    revalidatePath("/catalog");
    return NextResponse.json({ ok: true as const });
  } catch (err) {
    logApiError("api/stores/catalog/[productId]/threshold PATCH", err);
    return apiErrorResponse(err);
  }
}
