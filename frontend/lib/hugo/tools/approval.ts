import "server-only";

import { tool } from "ai";

import { sendIncidentNotification } from "@/lib/slack";
import { createIncidents } from "@/lib/stores/incidents";

import { incidentIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function incidentLink(id: string): string {
  return `${appUrl()}/incidents/${id}`;
}

export async function approveLowRiskActions(
  ctx: HugoToolContext,
  incidentId: string,
  approvedBy: string,
): Promise<{ approved_count: number; message: string }> {
  const store = createIncidents(ctx.supabase);
  const actionIds = await store.listLowRiskProposedActionIds(incidentId);
  if (actionIds.length === 0) {
    return {
      approved_count: 0,
      message: `There are no low-risk actions awaiting approval. Approve higher-risk actions in the app: ${incidentLink(incidentId)}`,
    };
  }

  await store.approveIncidentActions({
    incidentId,
    actionIds,
    approvedByUserId: approvedBy,
  });

  const updated = await store.getIncident(incidentId);
  if (updated?.product_id) {
    await store.captureRecoveryBaseline(
      updated.organization_id,
      updated.id,
      updated.product_id,
      updated.affected_kpi_keys,
    );
  }

  if (updated) {
    await sendIncidentNotification({
      title: updated.title,
      severity: updated.severity,
      status: "monitoring",
      impact_amount: updated.impact_amount,
      impact_label: updated.impact_label,
      root_cause: updated.root_cause,
      root_cause_confidence: updated.root_cause_confidence,
      incident_id: updated.id,
      app_url: appUrl(),
    });
  }

  return {
    approved_count: actionIds.length,
    message: `Approved ${actionIds.length} low-risk action(s). Incident is now in monitoring: ${incidentLink(incidentId)}`,
  };
}

export function createApprovalTools(ctx: HugoToolContext, approvedBy: string) {
  return {
    approveLowRiskActions: tool({
      description: "Approve all low-risk proposed fix actions for an incident",
      inputSchema: incidentIdInputSchema,
      execute: async ({ incidentId }) => approveLowRiskActions(ctx, incidentId, approvedBy),
    }),
  };
}
