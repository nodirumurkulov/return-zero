"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { incidentKeys } from "@/hooks/stores/incidents/keys";
import { triggerInvestigation, type TriggerInvestigationInput } from "@/lib/api/investigate/client";
import type { IncidentRef } from "@/types/incidents";

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
