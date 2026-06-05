import {
  approveIncidentBodySchema,
  approveIncidentResponseSchema,
  incidentDetailSchema,
  patchIncidentStatusBodySchema,
} from "@/lib/stores/incidents/schemas";
import type { Incident, IncidentDetail, IncidentRef } from "@/types/incidents";

import { apiClient } from "../client";

export type ApproveIncidentActionsApproval =
  | { readonly kind: "all_low_risk" }
  | { readonly kind: "action_ids"; readonly actionIds: readonly string[] };

export type ApproveIncidentActionsInput = {
  readonly incident: IncidentRef;
  readonly approval: ApproveIncidentActionsApproval;
};

export type ApproveIncidentActionsResult = {
  readonly approval: { readonly approvedCount: number };
};

export type PatchIncidentStatusInput = {
  readonly incident: IncidentRef;
  readonly status: { readonly value: string };
};

type ApproveIncidentBody =
  | { approve_all_low_risk: true }
  | { action_ids: string[] };

function toApproveBody(approval: ApproveIncidentActionsApproval): ApproveIncidentBody {
  if (approval.kind === "all_low_risk") {
    return { approve_all_low_risk: true };
  }
  return { action_ids: [...approval.actionIds] };
}

export async function getIncidentDetail(incident: IncidentRef): Promise<IncidentDetail> {
  const data = await apiClient(`/api/incidents/${incident.id}`, {
    output: incidentDetailSchema,
  });
  return data as IncidentDetail;
}

export async function patchIncidentStatus(input: PatchIncidentStatusInput): Promise<Incident> {
  const body = patchIncidentStatusBodySchema.parse({
    status: input.status.value,
    resolved_at: input.status.value === "resolved" ? new Date().toISOString() : null,
  });
  const data = await apiClient(`/api/incidents/${input.incident.id}`, {
    method: "PATCH",
    body,
  });
  return data as Incident;
}

export async function approveIncidentActions(
  input: ApproveIncidentActionsInput,
): Promise<ApproveIncidentActionsResult> {
  const body = approveIncidentBodySchema.parse(toApproveBody(input.approval));
  const data = await apiClient(`/api/incidents/${input.incident.id}/approve`, {
    method: "POST",
    body,
    output: approveIncidentResponseSchema,
  });
  return { approval: { approvedCount: data.approved } };
}
