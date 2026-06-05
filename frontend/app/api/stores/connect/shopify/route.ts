import { NextResponse } from "next/server";

import { tryRequireOrganizationId } from "@/lib/organizations";
import { ShopifyStore } from "@/lib/stores";
import {
  connectPartialResponseSchema,
  connectSuccessResponseSchema,
} from "@/lib/stores/connect/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const org = await tryRequireOrganizationId(auth);
  if (!org.ok) {
    return NextResponse.json({ error: org.error }, { status: 403 });
  }

  const supabase = createAdminClient();

  try {
    const { results, success } = await new ShopifyStore().connect(supabase, org.organizationId);
    const body = success
      ? connectSuccessResponseSchema.parse({ success: true, results })
      : connectPartialResponseSchema.parse({ success: false, results });
    return NextResponse.json(body, { status: success ? 200 : 207 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connect failed";
    const status = message.includes("Shopify") ? 501 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
