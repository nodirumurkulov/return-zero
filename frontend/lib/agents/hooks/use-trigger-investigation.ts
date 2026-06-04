"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  triggerInvestigation,
  type TriggerInvestigationInput,
} from "@/lib/agents/api";
import { incidentKeys } from "@/lib/incidents/api";
import type { IncidentRef } from "@/lib/incidents/incident";

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
