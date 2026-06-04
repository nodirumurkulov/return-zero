import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { detectForecastRisks } from "@/lib/detection/forecast";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/forecast — run predictive (forecast-based) detection over the catalogue.
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  try {
    const result = await detectForecastRisks(supabase);
    return NextResponse.json({
      success: true,
      scanned: result.scanned,
      created: result.created.length,
      skipped: result.skipped.length,
      incidents: result.created,
    });
  } catch (err) {
    logApiError("api/forecast", err);
    return apiErrorResponse(err);
  }
}
