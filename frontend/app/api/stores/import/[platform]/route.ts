import { after, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import {
  importSkippedResponseSchema,
  importSyncingResponseSchema,
  storePlatformSchema,
} from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const { platform } = await context.params;
  const platformParsed = storePlatformSchema.safeParse(platform);
  if (!platformParsed.success) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopeResult = await tryGetStoreScope(auth);
  if (!scopeResult.ok) {
    logApiError("api/stores/import/[platform]", new Error(scopeResult.error));
    return apiErrorResponse(new Error(scopeResult.error), 403);
  }

  const scope = scopeResult.scope;
  const supabase = createAdminClient();

  try {
    const store = getStore(supabase);
    const start = await store.import.tryStartImport({
      scope,
      platform: platformParsed.data,
    });

    if (start.action === "skipped") {
      return NextResponse.json(importSkippedResponseSchema.parse({ skipped: true }));
    }

    if (start.action === "started") {
      after(async () => {
        try {
          const { success } = await store.import.runBackgroundImport({
            scope,
            platform: platformParsed.data,
            replace: false,
          });
          if (success) {
            await store.orders.reset({ scope });
          }
        } catch (err) {
          logApiError("api/stores/import/[platform]", err);
        }
      });
    }

    return NextResponse.json(
      importSyncingResponseSchema.parse({ syncing: true }),
      { status: 202 },
    );
  } catch (err) {
    logApiError("api/stores/import/[platform]", err);
    return apiErrorResponse(err);
  }
}
