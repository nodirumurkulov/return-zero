import { type NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { replayBodySchema, resetReplay, runReplay } from "@/lib/stores/analytics/replay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/replay — advance the replay clock and detect anomalies AS OF the new
// cursor, opening incidents at the point in history a metric crosses its learned
// threshold. Body: { advance_days?: number }. Schedulable via CRON_SECRET.
export async function POST(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const cronMode = isCronInvocation(req, cronDenied);

  const session = cronMode ? null : await createClient();
  if (!cronMode && session) {
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) return cronDenied ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = replayBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = cronMode ? createAdminClient() : session!;
  try {
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    if (parsed.data.reset) {
      const resets = await Promise.all(
        organizationIds.map((organizationId) => resetReplay(supabase, organizationId)),
      );
      const cursor = resets[0]?.cursor ?? null;
      return NextResponse.json({
        success: true,
        reset: true,
        cursor,
        previous_cursor: cursor,
        at_end: false,
        created: 0,
      });
    }

    const results = await Promise.all(
      organizationIds.map((organizationId) =>
        runReplay(supabase, { organizationId, advanceDays: parsed.data.advance_days }),
      ),
    );
    const result = results[0];
    if (!result) {
      return NextResponse.json({ success: true, cursor: null, previous_cursor: null, at_end: true, created: 0 });
    }

    const created = results.reduce(
      (sum, r) => sum + r.breaches.created.length + r.forecast.created.length,
      0,
    );

    return NextResponse.json({
      success: true,
      cursor: result.cursor,
      previous_cursor: result.previous_cursor,
      at_end: result.at_end,
      created,
      breaches: result.breaches,
      forecast: result.forecast,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
