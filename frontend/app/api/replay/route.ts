import { type NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { resetReplay, runReplay } from "@/lib/detection/replay";
import { replayBodySchema } from "@/lib/detection/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listOwnerUserIds } from "@/lib/tenant/owner-user-ids";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/replay — advance the replay clock and detect anomalies AS OF the new
// cursor, opening incidents at the point in history a metric crosses its learned
// threshold. Body: { advance_days?: number }. Schedulable via CRON_SECRET.
export async function POST(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const raw = await req.json().catch(() => ({}));
  const parsed = replayBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  if (cronDenied) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return cronDenied;

    try {
      if (parsed.data.reset) {
        const { cursor } = await resetReplay(supabase, { ownerUserId: user.id });
        return NextResponse.json({
          success: true,
          reset: true,
          cursor,
          previous_cursor: cursor,
          at_end: false,
          created: 0,
        });
      }

      const result = await runReplay(supabase, {
        advanceDays: parsed.data.advance_days,
        ownerUserId: user.id,
      });
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

  const supabase = createAdminClient();
  try {
    const ownerIds = await listOwnerUserIds(supabase);
    const results = await Promise.all(
      ownerIds.map(async (ownerUserId) => {
        if (parsed.data.reset) {
          const { cursor } = await resetReplay(supabase, { ownerUserId });
          return { ownerUserId, reset: true, cursor, created: 0 };
        }
        const result = await runReplay(supabase, {
          advanceDays: parsed.data.advance_days,
          ownerUserId,
        });
        return {
          ownerUserId,
          cursor: result.cursor,
          previous_cursor: result.previous_cursor,
          at_end: result.at_end,
          created: result.breaches.created.length + result.forecast.created.length,
        };
      }),
    );

    if (parsed.data.reset) {
      return NextResponse.json({ success: true, reset: true, tenants: results });
    }

    const created = results.reduce((sum, r) => sum + (r.created ?? 0), 0);
    return NextResponse.json({ success: true, created, tenants: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
