import type { SupabaseClient } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { IncidentRef } from "../incident";
import type { IncidentDetail } from "../incident-detail";
import { getIncidentDetail } from "../queries";
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
    queryFn: () => getIncidentDetail(supabase, incident.id),
  };
}
