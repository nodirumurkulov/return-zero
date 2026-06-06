"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  approveIncidentActions,
  type ApproveIncidentActionsInput,
} from "@/lib/api/stores/incidents/client";
import type { IncidentRef } from "@/lib/stores";

export type { ApproveIncidentActionsInput };

export function useApproveActions(incident: IncidentRef) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: Omit<ApproveIncidentActionsInput, "incident">) =>
      approveIncidentActions({ incident, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
