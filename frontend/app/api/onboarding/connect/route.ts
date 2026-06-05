import { NextResponse } from "next/server";

import {
  onboardingConnectBodySchema,
  onboardingConnectPartialResponseSchema,
  onboardingConnectSuccessResponseSchema,
} from "@/lib/onboarding/api-schemas";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { storeConnectors } from "@/lib/stores/connect";
import { prettyFlyPack } from "@/lib/stores/connect/mock/pack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// POST /api/onboarding/connect — choose a store platform; mock_csv loads the Pretty Fly demo pack.
export async function POST(req: Request) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = onboardingConnectBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { platform } = parsed.data;
  if (platform === "shopify") {
    return NextResponse.json({ error: "Shopify is not available yet" }, { status: 501 });
  }

  const org = await tryRequireOrganizationId(auth);
  if (!org.ok) {
    return NextResponse.json({ error: org.error }, { status: 403 });
  }
  const { organizationId } = org;

  const connector = storeConnectors[platform];
  const supabase = createAdminClient();

  try {
    const source = prettyFlyPack.read();
    const results = await connector.load(supabase, organizationId, source, { replace: true });
    await connector.markConnected(supabase, organizationId);

    const ok = results.every((r) => !r.error);
    const body = ok
      ? onboardingConnectSuccessResponseSchema.parse({ success: true, results })
      : onboardingConnectPartialResponseSchema.parse({ success: false, results });
    return NextResponse.json(body, { status: ok ? 200 : 207 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
