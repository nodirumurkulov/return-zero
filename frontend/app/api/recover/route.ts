import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { createIncidents, recoverBodySchema } from "@/lib/stores/incidents";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/recover — advance projected recovery for monitoring incidents.
export async function POST(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const cronMode = isCronInvocation(req, cronDenied);

  const raw = await req.json().catch(() => ({}));
  const parsed = recoverBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

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
      organizationIds.map((organizationId) =>
        store.runRecovery({
          organizationId,
          advanceDays: parsed.data.advance_days,
        }),
      ),
    );
    const monitored = results.reduce((sum, r) => sum + r.monitored, 0);
    const updated = results.reduce((sum, r) => sum + r.updated, 0);
    const resolved = results.flatMap((r) => r.resolved);

    return NextResponse.json({ success: true, monitored, updated, resolved });
  } catch (err) {
    logApiError("api/recover", err);
    return apiErrorResponse(err);
  }
}
