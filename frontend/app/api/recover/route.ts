import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runRecovery } from "@/lib/detection/recover";
import { requireUserOrCron } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

// POST /api/recover — advance projected recovery for monitoring incidents and
// auto-resolve those that reach 100%. Body: { advance_days?: number } to
// fast-forward the monitoring clock (demo). Schedulable via CRON_SECRET.
export async function POST(req: NextRequest) {
  const unauthorized = await requireUserOrCron(req);
  if (unauthorized) return unauthorized;

  let advanceDays: number | undefined;
  try {
    const body = (await req.json()) as { advance_days?: number };
    if (typeof body?.advance_days === "number") advanceDays = body.advance_days;
  } catch {
    // no body — use real elapsed time
  }

  const supabase = createServiceClient();
  try {
    const result = await runRecovery(supabase, { advanceDays });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
