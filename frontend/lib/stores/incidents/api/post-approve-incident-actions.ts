import type { ApproveIncidentBody } from "../schemas";
import type { IncidentRef } from "../types";

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

function toRequestBody(approval: ApproveIncidentActionsApproval): ApproveIncidentBody {
  if (approval.kind === "all_low_risk") {
    return { approve_all_low_risk: true };
  }
  return { action_ids: [...approval.actionIds] };
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
