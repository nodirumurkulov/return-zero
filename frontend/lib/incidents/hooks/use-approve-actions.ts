"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  incidentKeys,
  postApproveIncidentActions,
  type PostApproveIncidentActionsInput,
} from "@/lib/incidents/api";
import type { IncidentRef } from "@/lib/incidents/incident";

export function useApproveActions(incident: IncidentRef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<PostApproveIncidentActionsInput, "incident">) =>
      postApproveIncidentActions({ incident, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incident.id) });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
    },
  });
}
