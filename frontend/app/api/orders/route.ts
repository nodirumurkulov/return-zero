import { type NextRequest, NextResponse } from "next/server";
import { streamEndDate } from "@/lib/detection/replay";
import { listIncomingOrders } from "@/lib/orders/queries";
import { ordersQuerySchema } from "@/lib/orders/schemas";
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

  try {
    const [orders, dataEnd, cursorRow] = await Promise.all([
      listIncomingOrders(supabase, parsed.data),
      streamEndDate(supabase),
      supabase.from("replay_state").select("cursor").eq("id", true).maybeSingle(),
    ]);
    return NextResponse.json({
      orders,
      cursor: cursorRow.data?.cursor ? String(cursorRow.data.cursor).slice(0, 10) : null,
      data_end: dataEnd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "orders feed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
