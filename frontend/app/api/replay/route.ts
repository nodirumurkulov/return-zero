import { type NextRequest, NextResponse } from "next/server";
import { resetReplay, runReplay } from "@/lib/detection/replay";
import { replayBodySchema } from "@/lib/detection/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/replay — advance the replay clock and detect anomalies AS OF the new
// cursor, opening incidents at the point in history a metric crosses its learned
// threshold. Body: { advance_days?: number }. Schedulable via CRON_SECRET.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
    if (auth !== `Bearer ${secret}` && auth !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = replayBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  try {
    // Reset rewinds the clock to the start (for re-running the orders-feed demo).
    if (parsed.data.reset) {
      const { cursor } = await resetReplay(supabase);
      return NextResponse.json({
        success: true,
        reset: true,
        cursor,
        previous_cursor: cursor,
        at_end: false,
        created: 0,
      });
    }

    const result = await runReplay(supabase, { advanceDays: parsed.data.advance_days });
    return NextResponse.json({
      success: true,
      cursor: result.cursor,
      previous_cursor: result.previous_cursor,
      at_end: result.at_end,
      created: result.breaches.created.length + result.forecast.created.length,
      breaches: result.breaches,
      forecast: result.forecast,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
