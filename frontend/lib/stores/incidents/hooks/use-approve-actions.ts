"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  incidentKeys,
  postApproveIncidentActions,
  type PostApproveIncidentActionsInput,
} from "../api";
import type { IncidentRef } from "../types";

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
