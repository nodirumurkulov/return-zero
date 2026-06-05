import "server-only";

import { hasToolCall, stepCountIs, ToolLoopAgent } from "ai";

import { getModel } from "@/lib/ai/model";

import type { HugoToolContext } from "../tools/context";
import { createHugoTools } from "../tools/index";
import type { HugoSupabase } from "../types";
import type { HugoRequest } from "./hugo-request";
import type { HugoInvestigationResponse, HugoResponse } from "./hugo-response";

const SLACK_STYLE =
  "You are chatting inside Slack. Be concise, friendly, and use plain language. " +
  "Slack does not render Markdown headings or tables, so prefer short paragraphs and " +
  "simple bullet points ('- '). Keep replies under ~1500 characters unless asked for more.";

const SLACK_INSTRUCTIONS = `You are Hugo, the assistant for Resolve — an ecommerce incident-response app. ${SLACK_STYLE}

Use the available tools to answer questions about incidents, KPIs, catalog health, inventory, returns, marketing, and forecasts.
When the user asks to investigate an incident, resolve the reference, gather product evidence with data tools, then call persistInvestigation.
When the user asks to approve fixes, resolve the incident and call approveLowRiskActions.
When you are ready to reply, call finalResponse with your complete message for the user.
Do not guess numbers — always call the relevant data tools first.`;

const INVESTIGATION_INSTRUCTIONS = `You are Hugo, investigating a commerce incident for Resolve.
Call data tools (returns, marketing, inventory, forecast, catalog, orders) for the affected product before concluding.
Produce multiple findings (returns, merchandising, marketing, inventory, forecasting perspectives) with specific numbers from tools.
Root cause must be 2-3 sentences citing exact figures. Propose 3-4 concrete actions; auto_deploy only for low-risk additive fixes.
When complete, call persistInvestigation with incidentId, findings, root_cause, root_cause_confidence (0-100), and actions.`;

type ToolResultRow = { toolName: string; output: unknown };

function extractToolMessage(steps: Array<{ toolResults: ToolResultRow[] }>, toolName: string): string | null {
  for (const step of steps) {
    for (const result of step.toolResults) {
      if (result.toolName !== toolName) continue;
      const output = result.output;
      if (
        typeof output === "object" &&
        output != null &&
        "message" in output &&
        typeof output.message === "string" &&
        output.message.trim()
      ) {
        return output.message.trim();
      }
    }
  }
  return null;
}

function extractPersistResult(steps: Array<{ toolResults: ToolResultRow[] }>): HugoInvestigationResponse | null {
  for (const step of steps) {
    for (const result of step.toolResults) {
      if (result.toolName !== "persistInvestigation") continue;
      const output = result.output;
      if (typeof output !== "object" || output == null) continue;
      const row = output as Record<string, unknown>;
      if (row.success !== true) continue;
      return {
        root_cause: typeof row.root_cause === "string" ? row.root_cause : "",
        root_cause_confidence: Number(row.root_cause_confidence ?? 0),
        findings_count: Number(row.findings_count ?? 0),
        actions_count: Number(row.actions_count ?? 0),
      };
    }
  }
  return null;
}

export async function runHugoSlackAgent(
  ctx: HugoToolContext,
  request: HugoRequest,
): Promise<HugoResponse> {
  const tools = createHugoTools(ctx, {
    approvedBy: request.userName ?? "slack-user",
    includePersist: true,
    includeApproval: true,
    includeFinalResponse: true,
  });

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: SLACK_INSTRUCTIONS,
    tools,
    stopWhen: [hasToolCall("finalResponse"), stepCountIs(12)],
  });

  const { steps, text } = await agent.generate({ prompt: request.prompt.trim() });
  const finalMessage = extractToolMessage(steps as Array<{ toolResults: ToolResultRow[] }>, "finalResponse");
  if (finalMessage) return { text: finalMessage };

  const trimmed = text.trim();
  if (trimmed) return { text: trimmed };

  return {
    text: "I couldn't finish that request — please try again or be more specific about the incident or product.",
  };
}

export async function runHugoInvestigation(
  supabase: HugoSupabase,
  organizationId: string,
  incidentId: string,
  productId: string,
  incidentTitle: string,
  affectedKpiKeys: string[],
): Promise<HugoInvestigationResponse> {
  const ctx: HugoToolContext = { supabase, organizationId };
  const tools = createHugoTools(ctx, {
    includePersist: true,
    includeApproval: false,
    includeFinalResponse: false,
  });

  const agent = new ToolLoopAgent({
    model: getModel(),
    instructions: INVESTIGATION_INSTRUCTIONS,
    tools,
    stopWhen: [hasToolCall("persistInvestigation"), stepCountIs(15)],
  });

  const { steps } = await agent.generate({
    prompt:
      `Investigate incident "${incidentTitle}" (id ${incidentId}) for product ${productId}. ` +
      `Breached KPIs: ${affectedKpiKeys.join(", ") || "unknown"}. ` +
      `Gather evidence with data tools, then call persistInvestigation.`,
  });

  const persisted = extractPersistResult(steps as Array<{ toolResults: ToolResultRow[] }>);
  if (persisted) return persisted;

  throw new Error("Hugo investigation: persistInvestigation was not called");
}

export async function runIncidentInvestigation(
  supabase: HugoSupabase,
  incidentId: string,
  productId: string,
): Promise<HugoInvestigationResponse> {
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("organization_id, title, affected_kpi_keys, product_id")
    .eq("id", incidentId)
    .single();
  if (error || !incident) {
    throw new Error(`incident not found: ${error?.message ?? "missing row"}`);
  }

  const resolvedProductId = incident.product_id ?? productId;
  if (!resolvedProductId) {
    throw new Error("incident has no product_id for investigation");
  }

  return runHugoInvestigation(
    supabase,
    incident.organization_id,
    incidentId,
    resolvedProductId,
    incident.title,
    incident.affected_kpi_keys,
  );
}
