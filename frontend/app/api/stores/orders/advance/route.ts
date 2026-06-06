import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { investigateCreatedIncidents } from "@/lib/hugo/investigate-incident";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { advanceBodySchema } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    const store = getStore(supabase);
    if (parsed.data.reset) {
      const resets = await Promise.all(
        organizationIds.map((organizationId) => store.orders.reset({ organizationId })),
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
        store.orders.advance({ organizationId, days: parsed.data.advance_days }),
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
      organizationIds.flatMap((organizationId, index) => {
        const orgCreated = results[index]?.breaches.created ?? [];
        return orgCreated.length > 0
          ? [store.incidents.notifyNew(organizationId, orgCreated)]
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
