import { updateIncidentStatus } from "@/app/actions";
import type { IncidentDetail, IncidentRef } from "@/types/incidents";

export type UpdateIncidentStatusInput = {
  readonly incident: IncidentRef;
  readonly status: { readonly value: string };
};

export type ApproveIncidentActionsApproval =
  | { readonly kind: "all_low_risk" }
  | { readonly kind: "action_ids"; readonly actionIds: readonly string[] };

export type PostApproveIncidentActionsInput = {
  readonly incident: IncidentRef;
  readonly approval: ApproveIncidentActionsApproval;
};

export type PostApproveIncidentActionsResult = {
  readonly approval: { readonly approvedCount: number };
};

type ApproveIncidentBody =
  | { approve_all_low_risk: true }
  | { action_ids: string[] };

function toRequestBody(approval: ApproveIncidentActionsApproval): ApproveIncidentBody {
  if (approval.kind === "all_low_risk") {
    return { approve_all_low_risk: true };
  }
  return { action_ids: [...approval.actionIds] };
}

export async function fetchIncidentDetail(incident: IncidentRef): Promise<IncidentDetail> {
  const res = await fetch(`/api/incidents/${incident.id}`);
  const json = (await res.json()) as IncidentDetail | { error?: string };
  if (!res.ok) {
    const message = "error" in json && json.error ? json.error : "Failed to load incident";
    throw new Error(message);
  }
  return json as IncidentDetail;
}

export async function postApproveIncidentActions(
  input: PostApproveIncidentActionsInput,
): Promise<PostApproveIncidentActionsResult> {
  const res = await fetch(`/api/incidents/${input.incident.id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequestBody(input.approval)),
  });
  const json = (await res.json()) as { approved?: number; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to approve actions");
  }
  return { approval: { approvedCount: json.approved ?? 0 } };
}

export async function updateIncidentStatusApi(input: UpdateIncidentStatusInput) {
  return updateIncidentStatus(input.incident.id, input.status.value);
}
