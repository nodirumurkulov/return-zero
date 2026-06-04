"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIncidentStatus } from "@/app/actions";
import type { IncidentRef } from "@/lib/incidents/incident";
import { incidentKeys } from "@/lib/incidents/incident-query-keys";

export type UpdateIncidentStatusInput = {
  readonly incident: IncidentRef;
  readonly status: { readonly value: string };
};

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateIncidentStatusInput) =>
      updateIncidentStatus(input.incident.id, input.status.value),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(input.incident.id) });
    },
  });
}
