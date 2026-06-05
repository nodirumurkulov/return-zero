"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import type { IncidentRef } from "@/types/incidents";

import { triggerInvestigation, type TriggerInvestigationInput } from "./api";

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
