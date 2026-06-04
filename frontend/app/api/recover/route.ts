import { type NextRequest, NextResponse } from "next/server";
import { runRecovery } from "@/lib/detection/recover";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/recover — advance projected recovery for monitoring incidents and
// auto-resolve those that reach 100%. Body: { advance_days?: number } to
// fast-forward the monitoring clock (demo). Schedulable via CRON_SECRET.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
    if (auth !== `Bearer ${secret}` && auth !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const advanceDays = await optionalAdvanceDays(req);
  const supabase = createServiceClient();

  try {
    const result = await runRecovery(supabase, { advanceDays });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function optionalAdvanceDays(req: NextRequest): Promise<number | undefined> {
  try {
    const body = (await req.json()) as { advance_days?: number };
    return typeof body.advance_days === "number" ? body.advance_days : undefined;
  } catch {
    return undefined;
  }
}
