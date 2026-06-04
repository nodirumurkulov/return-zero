import type { UseQueryOptions } from "@tanstack/react-query";
import type { IncidentRef } from "../incident";
import type { IncidentDetail } from "../incident-detail";
import { fetchIncidentDetail } from "./fetch-incident-detail";
import { incidentKeys } from "./incident-query-keys";

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
