import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, hasCronAuth, isCronSecretConfigured } from "@/lib/cron-auth";
import { detectBreaches } from "@/lib/detection/detect";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/detect — run deterministic KPI breach detection over the catalogue
// and open incidents for newly-breached products. Safe to call repeatedly: it
// dedups against products that already have an open incident.
export async function POST(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const cronMode =
    cronDenied === null && (!isCronSecretConfigured() || hasCronAuth(req));

  const supabase = cronMode ? createAdminClient() : await createClient();
  if (!cronMode) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return cronDenied ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    const results = await Promise.all(
      organizationIds.map((organizationId) => detectBreaches(supabase, { organizationId })),
    );
    const scanned = results.reduce((sum, r) => sum + r.scanned, 0);
    const created = results.flatMap((r) => r.created);
    const skipped = results.flatMap((r) => r.skipped);

    return NextResponse.json({
      success: true,
      scanned,
      created: created.length,
      skipped: skipped.length,
      incidents: created,
    });
  } catch (err) {
    logApiError("api/detect", err);
    return apiErrorResponse(err);
  }
}
