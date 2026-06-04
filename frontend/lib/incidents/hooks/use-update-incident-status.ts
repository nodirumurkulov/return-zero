"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { incidentKeys, updateIncidentStatusApi } from "@/lib/incidents/api";

export type { UpdateIncidentStatusInput } from "@/lib/incidents/api";

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
