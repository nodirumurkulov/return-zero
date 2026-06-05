"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  patchIncidentStatus,
  type PatchIncidentStatusInput,
} from "@/lib/api/incidents/client";

import { incidentKeys } from "./keys";

export type { PatchIncidentStatusInput as UpdateIncidentStatusInput };

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchIncidentStatus,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(input.incident.id) });
    },
  });
}
