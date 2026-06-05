import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { createIncidents } from "@/lib/stores/incidents";
import { notifyNewIncidents } from "@/lib/stores/incidents/notify-new-incidents";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/forecast — run predictive (forecast-based) detection over the catalogue.
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

  try {
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    const store = createIncidents(supabase);
    const results = await Promise.all(
      organizationIds.map((organizationId) => store.detectForecastRisks({ organizationId })),
    );
    await notifyNewIncidents(results.flatMap((r) => r.created));

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
    logApiError("api/forecast", err);
    return apiErrorResponse(err);
  }
}
