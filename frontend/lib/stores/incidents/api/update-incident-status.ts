import { updateIncidentStatus } from "@/app/actions";
import type { IncidentRef } from "../types";

export type UpdateIncidentStatusInput = {
  readonly incident: IncidentRef;
  readonly status: { readonly value: string };
};

export async function updateIncidentStatusApi(input: UpdateIncidentStatusInput) {
  return updateIncidentStatus(input.incident.id, input.status.value);
}
