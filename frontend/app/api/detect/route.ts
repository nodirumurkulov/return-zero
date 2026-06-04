import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { detectBreaches } from "@/lib/detection/detect";
import { requireUserOrCron } from "@/lib/auth-guard";

// POST /api/detect — run deterministic KPI breach detection over the catalogue
// and open incidents for newly-breached products. Safe to call repeatedly: it
// dedups against products that already have an open incident.
//
// Intended to be hit by a scheduler (e.g. a Vercel cron) or triggered manually.
// Requires either an authenticated Clerk session or a valid CRON_SECRET.
export async function POST(req: NextRequest) {
  const unauthorized = await requireUserOrCron(req);
  if (unauthorized) return unauthorized;

  const supabase = createServiceClient();
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
