import { type NextRequest, NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { learnBaselines } from "@/lib/stores/analytics/learn/baselines";
import { seedBusinessProfileFromStore } from "@/lib/stores/analytics/learn/business-profile";
import { buildBusinessReport } from "@/lib/stores/analytics/learn/report";
import { learnBodySchema } from "@/lib/stores/analytics/learn/schemas";
import { createReplay } from "@/lib/stores/analytics/replay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const parsed = learnBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
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
    logApiError("api/learn", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }
  const { organizationId } = org;

  const supabase = createAdminClient();
  try {
    await seedBusinessProfileFromStore(supabase, organizationId);
    const learn = await learnBaselines(supabase, organizationId);
    const report = await buildBusinessReport(supabase, organizationId);
    const { cursor: replayCursor } = await createReplay(supabase).reset(organizationId);
    return NextResponse.json({ success: true, learn, reportId: report.id, replayCursor });
  } catch (err) {
    logApiError("api/learn", err);
    return apiErrorResponse(err);
  }
}
