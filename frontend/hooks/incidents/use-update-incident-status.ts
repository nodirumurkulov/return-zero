"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateIncidentStatusApi, type UpdateIncidentStatusInput } from "./api";
import { incidentKeys } from "./keys";

export type { UpdateIncidentStatusInput };

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIncidentStatusApi,
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(input.incident.id) });
    },
  });
}
