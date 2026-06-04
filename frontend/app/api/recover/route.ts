import { type NextRequest, NextResponse } from "next/server";
import { runRecovery } from "@/lib/detection/recover";
import { recoverBodySchema } from "@/lib/detection/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const result = await runRecovery(supabase, { advanceDays: parsed.data.advance_days });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
