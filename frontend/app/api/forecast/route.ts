import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { detectForecastRisks } from "@/lib/detection/forecast";
import { requireUserOrCron } from "@/lib/auth-guard";

// POST /api/forecast — run predictive (forecast-based) detection over the
// catalogue and open forward-looking incidents per the config-driven
// forecast_rules. Dedups against open incidents; safe to schedule.
export async function POST(req: NextRequest) {
  const unauthorized = await requireUserOrCron(req);
  if (unauthorized) return unauthorized;

  const supabase = createServiceClient();
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
