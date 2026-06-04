"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IncidentRef } from "@/lib/incidents/incident";
import { incidentKeys } from "@/lib/incidents/incident-query-keys";
import {
  postApproveIncidentActions,
  type PostApproveIncidentActionsInput,
} from "@/lib/incidents/post-approve-incident-actions";

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
