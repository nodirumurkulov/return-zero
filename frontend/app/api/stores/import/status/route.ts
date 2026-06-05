import { NextResponse } from "next/server";

import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
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
    logApiError("api/stores/import/status", new Error(org.error));
    return apiErrorResponse(new Error(org.error), 403);
  }

  try {
    const connection = await getStore(supabase).import.status({
      organizationId: org.organizationId,
    });
    return NextResponse.json({ connection });
  } catch (err) {
    logApiError("api/stores/import/status", err);
    return apiErrorResponse(err);
  }
}
