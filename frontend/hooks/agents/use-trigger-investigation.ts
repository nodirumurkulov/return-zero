"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { triggerInvestigation, type TriggerInvestigationInput } from "@/lib/api/investigate/client";
import type { IncidentRef } from "@/lib/stores";

export function useTriggerInvestigation(incident: IncidentRef) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: Omit<TriggerInvestigationInput, "incident">) =>
      triggerInvestigation({ incident, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
