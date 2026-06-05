import "server-only";
import { sendIncidentNotification } from "@/lib/slack";
import type { Json } from "@/lib/supabase/database.types";
import { runInvestigation } from "./run-investigation";
import type { AgentSupabase, InvestigationResult } from "./types";

export type PersistInvestigationResult = {
  result: InvestigationResult;
  findings_count: number;
  actions_count: number;
};

export async function persistInvestigation(
  supabase: AgentSupabase,
  incidentId: string,
  productId: string,
): Promise<PersistInvestigationResult> {
  const { data: incident, error: incLoadErr } = await supabase
    .from("incidents")
    .select("organization_id, product_id, affected_kpi_keys")
    .eq("id", incidentId)
    .single();
  if (incLoadErr || !incident) {
    throw new Error(`incident not found: ${incLoadErr?.message ?? "missing row"}`);
  }

  const organizationId = incident.organization_id;
  const resolvedProductId = incident.product_id ?? productId;
  const affectedKpiKeys = incident.affected_kpi_keys;

  await supabase
    .from("incidents")
    .update({ status: "investigating", investigation_started_at: new Date().toISOString() })
    .eq("id", incidentId);

  await supabase.from("incident_timeline").insert({
    incident_id: incidentId,
    organization_id: organizationId,
    event_type: "agent_assigned",
    description: "4 agents dispatched in parallel: Returns, Merchandising, Marketing, Inventory",
  });

  const result = await runInvestigation(
    supabase,
    organizationId,
    incidentId,
    resolvedProductId,
    affectedKpiKeys,
  );

  await supabase.from("agent_findings").insert(
    result.findings.map((f) => ({
      incident_id: incidentId,
      organization_id: organizationId,
      agent_name: f.agent_name,
      agent_icon: f.agent_icon,
      summary: f.summary,
      detail: f.detail as Json,
    })),
  );

  await supabase.from("incident_actions").insert(
    result.actions.map((a) => ({
      incident_id: incidentId,
      organization_id: organizationId,
      title: a.title,
      description: a.description,
      impact_level: a.impact_level,
      risk_level: a.risk_level,
      auto_deploy: a.auto_deploy,
      status: "proposed" as const,
    })),
  );

  const now = new Date().toISOString();
  await supabase
    .from("incidents")
    .update({
      status: "fix_proposed",
      root_cause: result.root_cause,
      root_cause_confidence: result.root_cause_confidence,
      fix_proposed_at: now,
    })
    .eq("id", incidentId);

  await supabase.from("incident_timeline").insert([
    {
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "root_cause_found",
      description: `Root cause identified with ${result.root_cause_confidence}% confidence`,
      metadata: { confidence: result.root_cause_confidence, affected_kpi_keys: affectedKpiKeys },
    },
    {
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "action_proposed",
      description: `${result.actions.length} actions proposed`,
    },
  ]);

  const autoActions = result.actions.filter((a) => a.auto_deploy);
  if (autoActions.length > 0) {
    const { data: storedActions } = await supabase
      .from("incident_actions")
      .select("id, auto_deploy")
      .eq("incident_id", incidentId)
      .eq("auto_deploy", true);

    if (storedActions?.length) {
      const ids = storedActions.map((a) => a.id);
      await supabase
        .from("incident_actions")
        .update({
          status: "deployed",
          deployed_at: now,
        })
        .in("id", ids);

      await supabase.from("incident_timeline").insert({
        incident_id: incidentId,
        organization_id: organizationId,
        event_type: "deployed",
        description: `${ids.length} low-risk action(s) auto-deployed`,
      });
    }
  }

  const { data: incidentRow } = await supabase
    .from("incidents")
    .select("title, severity, impact_amount, impact_label")
    .eq("id", incidentId)
    .single();

  if (incidentRow) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendIncidentNotification({
      title: incidentRow.title,
      severity: incidentRow.severity,
      status: "fix_proposed",
      impact_amount: incidentRow.impact_amount,
      impact_label: incidentRow.impact_label,
      root_cause: result.root_cause,
      root_cause_confidence: result.root_cause_confidence,
      actions: result.actions,
      incident_id: incidentId,
      app_url: appUrl,
    });
  }

  return {
    result,
    findings_count: result.findings.length,
    actions_count: result.actions.length,
  };
}
