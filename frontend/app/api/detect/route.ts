import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { detectBreaches } from "@/lib/detection/detect";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOwnerUserIds } from "@/lib/tenant/owner-user-ids";

// POST /api/detect — run deterministic KPI breach detection over the catalogue
// and open incidents for newly-breached products. Safe to call repeatedly: it
// dedups against products that already have an open incident.
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  try {
    const ownerIds = await listOwnerUserIds(supabase);
    const results = await Promise.all(
      ownerIds.map((ownerUserId) => detectBreaches(supabase, { ownerUserId })),
    );
    const merged = results.reduce(
      (acc, result) => ({
        scanned: acc.scanned + result.scanned,
        created: [...acc.created, ...result.created],
        skipped: [...acc.skipped, ...result.skipped],
      }),
      { scanned: 0, created: [] as Awaited<ReturnType<typeof detectBreaches>>["created"], skipped: [] as Awaited<ReturnType<typeof detectBreaches>>["skipped"] },
    );
    return NextResponse.json({
      success: true,
      scanned: merged.scanned,
      created: merged.created.length,
      skipped: merged.skipped.length,
      incidents: merged.created,
    });
  } catch (err) {
    logApiError("api/detect", err);
    return apiErrorResponse(err);
  }
}
