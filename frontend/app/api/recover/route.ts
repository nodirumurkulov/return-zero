import { type NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { runRecovery } from "@/lib/detection/recover";
import { recoverBodySchema } from "@/lib/detection/schemas";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/recover — advance projected recovery for monitoring incidents.
export async function POST(req: NextRequest) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const raw = await req.json().catch(() => ({}));
  const parsed = recoverBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    const result = await runRecovery(supabase, { advanceDays: parsed.data.advance_days });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logApiError("api/recover", err);
    return apiErrorResponse(err);
  }
}
