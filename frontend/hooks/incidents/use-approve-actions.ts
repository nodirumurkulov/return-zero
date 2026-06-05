"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { IncidentRef } from "@/types/incidents";

import {
  postApproveIncidentActions,
  type PostApproveIncidentActionsInput,
} from "./api";
import { incidentKeys } from "./keys";

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
