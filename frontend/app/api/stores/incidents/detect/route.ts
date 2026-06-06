import type { SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { investigateCreatedIncidents } from "@/lib/hugo/investigate-incident";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { detectBodySchema, mergeDetectionResults } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function detectOrganization(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string | undefined,
  asOf: string | undefined,
) {
  const store = getStore(supabase);
  if (productId) {
    return store.incidents.detect({ organizationId, productId, asOf });
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", organizationId);
  if (error) throw new Error(`load products failed: ${error.message}`);

  const results = await Promise.all(
    (products ?? []).map((p) =>
      store.incidents.detect({ organizationId, productId: p.id, asOf }),
    ),
  );
  return mergeDetectionResults(results);
}

export async function POST(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const cronMode = isCronInvocation(req, cronDenied);

  const supabase = cronMode ? createAdminClient() : await createClient();
  if (!cronMode) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return cronDenied ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = detectBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  if (!cronMode && !parsed.data.product_id) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  try {
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    const { product_id: productId, as_of: asOf } = parsed.data;
    const results = await Promise.all(
      organizationIds.map((organizationId) =>
        detectOrganization(supabase, organizationId, productId, asOf),
      ),
    );
    const created = results.flatMap((r) => r.created);
    const store = getStore(supabase);
    await store.incidents.notifyNew(created);
    void investigateCreatedIncidents(supabase, created);

    const scanned = results.reduce((sum, r) => sum + r.scanned, 0);
    const skipped = results.flatMap((r) => r.skipped);

    return NextResponse.json({
      success: true,
      scanned,
      created: created.length,
      skipped: skipped.length,
      incidents: created,
    });
  } catch (err) {
    logApiError("api/stores/incidents/detect", err);
    return apiErrorResponse(err);
  }
}
