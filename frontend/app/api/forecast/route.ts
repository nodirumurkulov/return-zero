import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { detectForecastRisks } from "@/lib/detection/forecast";

// POST /api/forecast — run predictive (forecast-based) detection over the
// catalogue and open forward-looking incidents per the config-driven
// forecast_rules. Dedups against open incidents; safe to schedule.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
    if (auth !== `Bearer ${secret}` && auth !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

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
