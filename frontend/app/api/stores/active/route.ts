import { NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";
import { appTenancyResponseSchema, switchActiveStoreBodySchema } from "@/lib/tenancy";
import { getTenancy } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await request.json().catch(() => ({}));
  const parsed = switchActiveStoreBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    const tenancy = await getTenancy(supabase).setActiveStore({
      storeId: parsed.data.storeId,
    });
    return NextResponse.json(appTenancyResponseSchema.parse(tenancy));
  } catch (err) {
    logApiError("api/stores/active", err);
    return apiErrorResponse(err);
  }
}
