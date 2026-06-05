import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { getStore, notifyNewIncidents } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

    const store = getStore(supabase);
    const results = await Promise.all(
      organizationIds.map((organizationId) => store.incidents.forecast({ organizationId })),
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
    logApiError("api/stores/incidents/forecast-risk", err);
    return apiErrorResponse(err);
  }
}
