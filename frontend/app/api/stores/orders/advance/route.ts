import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { investigateCreatedIncidents } from "@/lib/hugo/investigate-incident";
import { advanceBodySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TypedSupabaseClient } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";
import { getStoreScope, listAllStoreScopes } from "@/lib/tenancy/server";
import type { StoreScope } from "@/lib/tenancy/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function scopesForRequest(
  supabase: TypedSupabaseClient,
  cronMode: boolean,
): Promise<StoreScope[]> {
  if (!cronMode) {
    return [await getStoreScope()];
  }

  return listAllStoreScopes(supabase);
}

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

  const raw: unknown = await req.json().catch(() => ({}));
  const parsed = advanceBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = cronMode ? createAdminClient() : session!;
  try {
    const scopes = await scopesForRequest(supabase, cronMode);

    const store = getStore(supabase);
    if (parsed.data.reset) {
      const resets = await Promise.all(scopes.map((scope) => store.orders.reset({ scope })));
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
      scopes.map((scope) =>
        store.orders.advance({ scope, days: parsed.data.advance_days }),
      ),
    );
    const result = results[0];
    if (!result) {
      return NextResponse.json({
        success: true,
        cursor: null,
        previous_cursor: null,
        at_end: true,
        created: 0,
      });
    }

    const createdIncidents = results.flatMap((r) => r.breaches.created);

    await Promise.all(
      scopes.flatMap((scope, index) => {
        const orgCreated = results[index]?.breaches.created ?? [];
        return orgCreated.length > 0
          ? [store.incidents.notifyNew(scope.organizationId, orgCreated)]
          : [];
      }),
    );
    void investigateCreatedIncidents(supabase, createdIncidents);

    return NextResponse.json({
      success: true,
      cursor: result.cursor,
      previous_cursor: result.previous_cursor,
      at_end: result.at_end,
      created: createdIncidents.length,
      breaches: result.breaches,
    });
  } catch (err) {
    logApiError("api/stores/orders/advance", err);
    return apiErrorResponse(err);
  }
}
