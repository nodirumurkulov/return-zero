import type { UseQueryOptions } from "@tanstack/react-query";

import { getIncidentDetail } from "@/lib/api/incidents/client";
import type { IncidentDetail, IncidentRef } from "@/types/incidents";

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
    queryFn: () => getIncidentDetail(incident),
  };
}
