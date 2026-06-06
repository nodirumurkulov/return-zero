import { NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) {
    logApiError("api/stores/import/status", new Error(scopeResult.error));
    return apiErrorResponse(new Error(scopeResult.error), 403);
  }

  try {
    const scope = scopeResult.scope;
    const store = getStore(supabase);
    const [connection, productCount] = await Promise.all([
      store.import.status({ scope }),
      store.import.productCount(scope),
    ]);
    return NextResponse.json({ connection, productCount });
  } catch (err) {
    logApiError("api/stores/import/status", err);
    return apiErrorResponse(err);
  }
}
