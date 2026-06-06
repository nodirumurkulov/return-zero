import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { ordersQuerySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
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
    logApiError("api/stores/orders/feed", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }

  try {
    const store = getStore(supabase);
    const [orders, bounds] = await Promise.all([
      store.orders.list({ organizationId: org.organizationId, ...parsed.data }),
      store.orders.bounds({ organizationId: org.organizationId }),
    ]);
    return NextResponse.json({
      orders,
      cursor: bounds.cursor?.slice(0, 10) ?? null,
      data_end: bounds.dataEnd,
    });
  } catch (err) {
    logApiError("api/stores/orders/feed", err);
    return apiErrorResponse(err);
  }
}
