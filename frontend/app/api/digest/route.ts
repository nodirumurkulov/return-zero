import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { buildDigestBlocks, summarizeIncidents } from "@/lib/hugo/digest";
import { listIncidents } from "@/lib/incidents";
import { listAllOrganizationIds, requireOrganizationId } from "@/lib/organizations";
import { postWebhookBlocks } from "@/lib/slack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// GET /api/digest — post a daily digest to Slack with open incident counts,
// total exposure, and top incidents. Schedulable via Vercel cron + CRON_SECRET.
export async function GET(req: NextRequest) {
  const cronDenied = assertCronAuthorized(req);
  const cronMode = isCronInvocation(req, cronDenied);

  const supabase = cronMode ? createAdminClient() : await createClient();
  if (!cronMode) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return (
        cronDenied ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
  }

  try {
    const organizationIds = cronMode
      ? await listAllOrganizationIds(supabase)
      : [await requireOrganizationId(supabase)];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const digests: Array<{ organizationId: string; openCount: number }> = [];

    for (const organizationId of organizationIds) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single();

      const incidents = await listIncidents(supabase, organizationId);
      const summary = summarizeIncidents(incidents);
      const orgName = org?.name ?? "Organization";
      const blocks = buildDigestBlocks(orgName, summary, appUrl);

      await postWebhookBlocks(blocks);
      digests.push({ organizationId, openCount: summary.openCount });
    }

    return NextResponse.json({ success: true, digests });
  } catch (err) {
    logApiError("api/digest", err);
    return apiErrorResponse(err);
  }
}
