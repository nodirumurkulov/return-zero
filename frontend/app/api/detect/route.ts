import { type NextRequest, NextResponse } from "next/server";
import { detectBreaches } from "@/lib/detection/detect";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/detect — run deterministic KPI breach detection over the catalogue
// and open incidents for newly-breached products. Safe to call repeatedly: it
// dedups against products that already have an open incident.
//
// Intended to be hit by a scheduler (e.g. a Vercel cron) or triggered manually.
// If CRON_SECRET is set, callers must present it.
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
