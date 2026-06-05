import { NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import {
  importPartialResponseSchema,
  importSuccessResponseSchema,
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
    const { results, success } = await getStore(supabase).import.run({
      organizationId: org.organizationId,
      platform: platformParsed.data,
    });
    const body = success
      ? importSuccessResponseSchema.parse({ success: true, results })
      : importPartialResponseSchema.parse({ success: false, results });
    return NextResponse.json(body, { status: success ? 200 : 207 });
  } catch (err) {
    logApiError("api/stores/import/[platform]", err);
    return apiErrorResponse(err);
  }
}
