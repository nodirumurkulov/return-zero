import type { SupabaseClient } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";
import { createIncidents } from "../store";
import type { IncidentDetail, IncidentRef } from "../types";
import { incidentKeys } from "./incident-query-keys";

export function getIncidentDetailQueryOptions(
  supabase: SupabaseClient,
  incident: IncidentRef,
): UseQueryOptions<
  IncidentDetail | null,
  Error,
  IncidentDetail | null,
  ReturnType<typeof incidentKeys.detail>
> {
  return {
    queryKey: incidentKeys.detail(incident.id),
    queryFn: () => createIncidents(supabase).getIncidentDetail(incident.id),
  };
}
