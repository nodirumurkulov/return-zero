import type { IncidentRef } from "../incident";
import type { IncidentDetail } from "../incident-detail";

export type FetchIncidentDetailInput = {
  readonly incident: IncidentRef;
};

export async function fetchIncidentDetail(input: FetchIncidentDetailInput): Promise<IncidentDetail> {
  const res = await fetch(`/api/incidents/${input.incident.id}`);
  const json = (await res.json()) as IncidentDetail | { error?: string };
  if (!res.ok) {
    const message = "error" in json && json.error ? json.error : "Failed to load incident";
    throw new Error(message);
  }
  return json as IncidentDetail;
}
