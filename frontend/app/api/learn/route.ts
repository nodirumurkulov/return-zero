import { NextResponse } from "next/server";
import { resetReplay } from "@/lib/detection/replay";
import { learnBaselines } from "@/lib/learn/baselines";
import { buildBusinessReport } from "@/lib/learn/report";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// BYOD Phase 2 — after upload, learn the store's baselines (knowledge base) and
// build the business report. Heavy read pass over the full history, so allow time.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  try {
    const learn = await learnBaselines(supabase);
    const report = await buildBusinessReport(supabase);
    // Rewind the replay clock to the start of the live window so the incidents
    // board stays empty until the user presses Start on the Orders stream.
    const { cursor } = await resetReplay(supabase);
    return NextResponse.json({ success: true, learn, reportId: report.id, replayCursor: cursor });
  } catch (err) {
    const message = err instanceof Error ? err.message : "learn failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
