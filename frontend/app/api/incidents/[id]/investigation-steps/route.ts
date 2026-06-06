import { type NextRequest, NextResponse } from "next/server";

import { loadLatestInvestigationSteps } from "@/lib/agents/investigation-steps";
import { investigationStepsResponseSchema } from "@/lib/agents/schemas";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) {
    return NextResponse.json({ error: scopeResult.error }, { status: 403 });
  }

  try {
    const scope = scopeResult.scope;
    const incident = await getStore(supabase).incidents.get({
      id: params.id,
      scope,
    });
    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const snapshot = await loadLatestInvestigationSteps(supabase, {
      organizationId: scope.organizationId,
      incidentId: params.id,
      incidentStatus: incident.status,
    });

    const body = investigationStepsResponseSchema.parse({
      run_id: snapshot.run_id,
      run_status: snapshot.run_status,
      steps: snapshot.steps.map((step) => ({
        id: step.id,
        step_key: step.step_key,
        agent_name: step.agent_name,
        label: step.label,
        status: step.status,
        created_at: step.created_at,
        updated_at: step.updated_at,
      })),
    });

    return NextResponse.json(body);
  } catch (err) {
    logApiError("api/incidents/[id]/investigation-steps GET", err);
    return apiErrorResponse(err);
  }
}
