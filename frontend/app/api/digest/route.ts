import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized, isCronInvocation } from "@/lib/cron-auth";
import { buildDigestBlocks, summarizeIncidents } from "@/lib/hugo/digest";
import { postAwaitingApprovalEscalation } from "@/lib/hugo/escalate";
import { postOrgSlackBlocks } from "@/lib/slack";
import type { Incident } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TypedSupabaseClient } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";
import { getStoreScope, listAllStoreScopes } from "@/lib/tenancy/server";
import type { StoreScope } from "@/lib/tenancy/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function scopesForRequest(
  supabase: TypedSupabaseClient,
  cronMode: boolean,
): Promise<StoreScope[]> {
  if (!cronMode) {
    return [await getStoreScope()];
  }

  return listAllStoreScopes(supabase);
}

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
    if (!user) {
      return (
        cronDenied ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
  }

  try {
    const scopes = await scopesForRequest(supabase, cronMode);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const digests: Array<{ organizationId: string; openCount: number }> = [];
    const escalations: Array<{ organizationId: string; count: number }> = [];

    const incidentsByOrg = new Map<string, Incident[]>();

    await Promise.all(
      scopes.map(async (scope) => {
        const incidents = await getStore(supabase).incidents.list({ scope });
        const existing = incidentsByOrg.get(scope.organizationId) ?? [];
        incidentsByOrg.set(scope.organizationId, [...existing, ...incidents]);
      }),
    );

    for (const [organizationId, incidents] of incidentsByOrg) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single();

      const summary = summarizeIncidents(incidents);
      const orgName = org?.name ?? "Organization";
      const blocks = buildDigestBlocks(orgName, summary, appUrl);
      const fallbackText =
        summary.openCount === 0
          ? `Daily Digest — ${orgName}: all clear`
          : `Daily Digest — ${orgName}: ${summary.openCount} open incident(s)`;

      await postOrgSlackBlocks(supabase, organizationId, blocks, fallbackText);
      digests.push({ organizationId, openCount: summary.openCount });
      if (cronMode) {
        escalations.push(
          await postAwaitingApprovalEscalation(supabase, {
            organizationId,
            orgName,
            incidents,
            appUrl,
          }),
        );
      }
    }

    return NextResponse.json({ success: true, digests, escalations });
  } catch (err) {
    logApiError("api/digest", err);
    return apiErrorResponse(err);
  }
}
