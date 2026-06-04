import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { detectBreaches } from "@/lib/detection/detect";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/detect — run deterministic KPI breach detection over the catalogue
// and open incidents for newly-breached products. Safe to call repeatedly: it
// dedups against products that already have an open incident.
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  try {
    const result = await detectBreaches(supabase);
    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      created: result.created.length,
      skipped: result.skipped.length,
      incidents: result.created,
    });
  } catch (err) {
    logApiError("api/detect", err);
    return apiErrorResponse(err);
  }
}
