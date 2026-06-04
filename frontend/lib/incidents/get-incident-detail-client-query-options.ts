import type { UseQueryOptions } from "@tanstack/react-query";
import { fetchIncidentDetail } from "@/lib/incidents/fetch-incident-detail";
import type { IncidentRef } from "@/lib/incidents/incident";
import type { IncidentDetail } from "@/lib/incidents/incident-detail";
import { incidentKeys } from "@/lib/incidents/incident-query-keys";

export function getIncidentDetailClientQueryOptions(
  incident: IncidentRef,
): UseQueryOptions<
  IncidentDetail,
  Error,
  IncidentDetail,
  ReturnType<typeof incidentKeys.detail>
> {
  return {
    queryKey: incidentKeys.detail(incident.id),
    queryFn: () => fetchIncidentDetail({ incident }),
  };
}
