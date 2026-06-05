import { NextResponse } from "next/server";

import { tryRequireOrganizationId } from "@/lib/organizations";
import { StoreConnections } from "@/lib/stores";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return NextResponse.json({ error: org.error }, { status: 403 });
  }

  try {
    const connection = await new StoreConnections().get(supabase, org.organizationId);
    return NextResponse.json({ connection });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load store connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
