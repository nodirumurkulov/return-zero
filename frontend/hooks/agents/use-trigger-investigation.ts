"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { incidentKeys } from "@/hooks/incidents/keys";
import type { IncidentRef } from "@/types/incidents";

import { triggerInvestigation, type TriggerInvestigationInput } from "./api";

export function useTriggerInvestigation(incident: IncidentRef) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<TriggerInvestigationInput, "incident">) =>
      triggerInvestigation({ incident, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incident.id) });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.list() });
    },
  });
}
