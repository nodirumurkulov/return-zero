import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createReplay, ordersQuerySchema } from "@/lib/stores/analytics/replay";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    logApiError("api/stores/analytics/replay/orders", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }

  try {
    const replay = createReplay(supabase);
    const [orders, dataEnd, cursor] = await Promise.all([
      replay.listIncomingOrders({ organizationId: org.organizationId, ...parsed.data }),
      replay.dataEndDate(org.organizationId),
      replay.readCursor(org.organizationId),
    ]);
    return NextResponse.json({
      orders,
      cursor: cursor?.slice(0, 10) ?? null,
      data_end: dataEnd,
    });
  } catch (err) {
    logApiError("api/stores/analytics/replay/orders", err);
    return apiErrorResponse(err);
  }
}
