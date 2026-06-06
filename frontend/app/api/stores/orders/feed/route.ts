import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { ordersQuerySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

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

  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) {
    logApiError("api/stores/orders/feed", new Error(scopeResult.error));
    return apiErrorResponse(new Error(scopeResult.error), 403);
  }

  try {
    const scope = scopeResult.scope;
    const store = getStore(supabase);
    const [orders, bounds] = await Promise.all([
      store.orders.list({ scope, ...parsed.data }),
      store.orders.bounds({ scope }),
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
