import { NextResponse } from "next/server";
import { saveBusinessProfile } from "@/lib/settings/mutations";
import { loadBusinessProfile, loadProductCostRows } from "@/lib/settings/queries";
import {
  businessProfileInputSchema,
  businessProfileResponseSchema,
  saveProfileSuccessSchema,
} from "@/lib/settings/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  try {
    const [profile, productCosts] = await Promise.all([
      loadBusinessProfile(supabase),
      loadProductCostRows(supabase),
    ]);
    const body = businessProfileResponseSchema.parse({
      profile: {
        platform: profile.platform,
        storeName: profile.storeName,
        primaryGoal: profile.primaryGoal,
        targetMarginPct: profile.targetMarginPct,
        minRoas: profile.minRoas,
        leadTimeDays: profile.leadTimeDays,
        bufferDays: profile.bufferDays,
        heroProductIds: profile.heroProductIds,
      },
      productCosts,
    });
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: unknown = await req.json().catch(() => null);
  const parsed = businessProfileInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid profile" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  try {
    await saveBusinessProfile(supabase, parsed.data);
    return NextResponse.json(saveProfileSuccessSchema.parse({ success: true }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
