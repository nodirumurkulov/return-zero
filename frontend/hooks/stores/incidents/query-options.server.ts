import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";

import { createIncidents } from "@/lib/stores/incidents";
import type { IncidentDetail, IncidentRef } from "@/types/incidents";

import { incidentKeys } from "./keys";

export function getIncidentDetailQueryOptions(
  supabase: SupabaseClient,
  incident: IncidentRef,
  organizationId: string,
): UseQueryOptions<
  IncidentDetail | null,
  Error,
  IncidentDetail | null,
  ReturnType<typeof incidentKeys.detail>
> {
  return {
    queryKey: incidentKeys.detail(incident.id),
    queryFn: () => createIncidents(supabase).getIncidentDetail(incident.id, organizationId),
  };
}
