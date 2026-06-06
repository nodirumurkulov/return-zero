import { after, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import {
  importImportingResponseSchema,
  importSkippedResponseSchema,
  storePlatformSchema,
} from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const org = await tryRequireOrganizationId(auth);
  if (!org.ok) {
    logApiError("api/stores/import/[platform]", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }

  const supabase = createAdminClient();

  try {
    const store = getStore(supabase);
    const start = await store.import.tryStartImport({
      organizationId: org.organizationId,
      platform: platformParsed.data,
    });

    if (start.action === "skipped") {
      return NextResponse.json(importSkippedResponseSchema.parse({ skipped: true }));
    }

    if (start.action === "started") {
      after(async () => {
        try {
          const { success } = await store.import.runBackgroundImport({
            organizationId: org.organizationId,
            platform: platformParsed.data,
            replace: false,
          });
          if (success) {
            await store.orders.reset({ organizationId: org.organizationId });
          }
        } catch (err) {
          logApiError("api/stores/import/[platform]", err);
        }
      });
    }

    return NextResponse.json(
      importImportingResponseSchema.parse({ importing: true }),
      { status: 202 },
    );
  } catch (err) {
    logApiError("api/stores/import/[platform]", err);
    return apiErrorResponse(err);
  }
}
