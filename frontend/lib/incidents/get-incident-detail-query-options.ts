import type { SupabaseClient } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { IncidentRef } from "@/lib/incidents/incident";
import type { IncidentDetail } from "@/lib/incidents/incident-detail";
import { incidentKeys } from "@/lib/incidents/incident-query-keys";
import { getIncidentDetail } from "@/lib/incidents/queries";

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
