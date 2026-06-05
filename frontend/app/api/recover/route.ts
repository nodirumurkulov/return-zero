import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { runRecovery } from "@/lib/detection/recover";
import { recoverBodySchema } from "@/lib/detection/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOwnerUserIds } from "@/lib/tenant/owner-user-ids";

export const dynamic = "force-dynamic";

// POST /api/recover — advance projected recovery for monitoring incidents.
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const raw = await req.json().catch(() => ({}));
  const parsed = recoverBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    const ownerIds = await listOwnerUserIds(supabase);
    const results = await Promise.all(
      ownerIds.map((ownerUserId) =>
        runRecovery(supabase, { advanceDays: parsed.data.advance_days, ownerUserId }),
      ),
    );
    const merged = results.reduce(
      (acc, result) => ({
        monitored: acc.monitored + result.monitored,
        updated: acc.updated + result.updated,
        resolved: [...acc.resolved, ...result.resolved],
      }),
      { monitored: 0, updated: 0, resolved: [] as string[] },
    );
    return NextResponse.json({ success: true, ...merged });
  } catch (err) {
    logApiError("api/recover", err);
    return apiErrorResponse(err);
  }
}
