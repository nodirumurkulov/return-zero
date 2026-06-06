import "server-only";
import type { StoreScope } from "@/lib/tenancy/types";
import type { InvestigationStepEmitter } from "./investigation-steps";
import { runOperator } from "./operator";
import { runQuantAnalyst } from "./quant-analyst";
import type {
  AgentSupabase,
  InvestigationAction,
  InvestigationResult,
  LlmAgentFinding,
  OperatorAction,
  QuantFinding,
} from "./types";

/** Fold the quant's stat fields into the finding's free `detail` JSON (no DB migration). */
function toFinding(q: QuantFinding): LlmAgentFinding {
  const stats: Record<string, unknown> = {};
  if (q.z_score != null) stats.z_score = q.z_score;
  if (q.sigma != null) stats.sigma = q.sigma;
  if (q.ci != null) stats.ci = q.ci;
  if (q.confidence != null) stats.confidence = q.confidence;
  if (q.quantity != null) stats.quantity = q.quantity;
  return {
    agent_name: q.agent_name,
    agent_icon: q.agent_icon,
    summary: q.summary,
    detail: { ...q.detail, ...stats },
  };
}

/**
 * Fold the operator's extras (goal rationale, £, confidence) into the action's
 * description. incident_actions has no JSON column, so this is lossy by design;
 * the trailing "Est. impact … · Confidence …" line is machine-parseable for the
 * UI to lift into chips. (A future migration can give these real columns.)
 */
function toAction(a: OperatorAction): InvestigationAction {
  const lines = [a.description];
  if (a.goal_rationale) lines.push(`Why: ${a.goal_rationale}`);
  const meta: string[] = [];
  if (a.estimated_impact_gbp != null) {
    meta.push(`Est. impact: £${Math.round(a.estimated_impact_gbp).toLocaleString("en-GB")}`);
  }
  if (a.confidence) meta.push(`Confidence: ${a.confidence}`);
  if (meta.length > 0) lines.push(meta.join(" · "));
  return {
    title: a.title,
    description: lines.join("\n"),
    impact_level: a.impact_level,
    risk_level: a.risk_level,
    auto_deploy: a.auto_deploy,
  };
}

export async function runInvestigation(
  supabase: AgentSupabase,
  scope: StoreScope,
  _incidentId: string,
  productId: string,
  _affectedKpiKeys: string[],
  steps?: InvestigationStepEmitter,
): Promise<InvestigationResult> {
  if (steps) {
    await steps.startStep({
      stepKey: "quant:dispatched",
      agentName: "Quant Analyst",
      label: "Quant Analyst dispatched",
    });
    await steps.finishStep("quant:dispatched");
  }

  const diagnosis = await runQuantAnalyst(supabase, scope, productId, steps);

  if (steps) {
    await steps.startStep({
      stepKey: "quant:complete",
      agentName: "Quant Analyst",
      label: "Quant diagnosis complete",
    });
    await steps.finishStep("quant:complete");
    await steps.startStep({
      stepKey: "operator:dispatched",
      agentName: "Operator",
      label: "Operator dispatched",
    });
    await steps.finishStep("operator:dispatched");
  }

  const operator = await runOperator(supabase, scope.organizationId, productId, diagnosis, steps);

  if (steps) {
    await steps.startStep({
      stepKey: "operator:complete",
      agentName: "Operator",
      label: "Proposed actions ready",
    });
    await steps.finishStep("operator:complete");
  }

  return {
    findings: diagnosis.findings.map(toFinding),
    // incidents.root_cause_confidence is an integer column — clamp the model's
    // 0-100 value to a whole number so the insert can never 400 on a decimal.
    root_cause: operator.root_cause,
    root_cause_confidence: Math.max(
      0,
      Math.min(100, Math.round(operator.root_cause_confidence ?? 0)),
    ),
    actions: operator.actions.map(toAction),
  };
}
