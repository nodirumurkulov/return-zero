import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";

import type { IncidentDetail, IncidentRef } from "@/lib/stores";
import { getStore } from "@/lib/stores/server";

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
    queryFn: () =>
      getStore(supabase).incidents.get({
        id: incident.id,
        organizationId,
        detail: true,
      }) as Promise<IncidentDetail | null>,
  };
}
