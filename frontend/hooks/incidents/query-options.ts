import type { UseQueryOptions } from "@tanstack/react-query";

import type { IncidentDetail, IncidentRef } from "@/types/incidents";

import { fetchIncidentDetail } from "./api";
import { incidentKeys } from "./keys";

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
    queryFn: () => fetchIncidentDetail(incident),
  };
}
