import { type NextRequest, NextResponse } from "next/server";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createReplay, ordersQuerySchema } from "@/lib/stores/analytics/replay";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/orders?after=<iso>&limit=<n> — the next batch of orders arriving after
// a timestamp (the replay stream's buffer source), plus the current replay cursor
// and the data end so the feed knows when to stop.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ordersQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid query" },
      { status: 400 },
    );
  }

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return NextResponse.json({ error: org.error }, { status: 403 });
  }
  const { organizationId } = org;

  try {
    const replay = createReplay(supabase);
    const [orders, dataEnd, cursorRow] = await Promise.all([
      replay.listIncomingOrders({ organizationId, ...parsed.data }),
      replay.dataEndDate(organizationId),
      supabase
        .from("store_connections")
        .select("replay_cursor")
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ]);
    const cursor = cursorRow.data?.replay_cursor?.slice(0, 10) ?? null;
    return NextResponse.json({
      orders,
      cursor,
      data_end: dataEnd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "orders feed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
