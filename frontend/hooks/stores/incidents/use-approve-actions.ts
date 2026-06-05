"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approveIncidentActions, type ApproveIncidentActionsInput } from "@/lib/api/incidents/client";
import type { IncidentRef } from "@/types/incidents";

import { incidentKeys } from "./keys";

export type { ApproveIncidentActionsInput };

export function useApproveActions(incident: IncidentRef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<ApproveIncidentActionsInput, "incident">) =>
      approveIncidentActions({ incident, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incident.id) });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
    },
  });
}
