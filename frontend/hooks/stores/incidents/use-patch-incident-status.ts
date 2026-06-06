"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  patchIncidentStatus,
  type PatchIncidentStatusInput,
} from "@/lib/api/stores/incidents/client";
import type { IncidentRef } from "@/lib/stores";

export type { PatchIncidentStatusInput };

export function usePatchIncidentStatus(incident: IncidentRef) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: Omit<PatchIncidentStatusInput, "incident">) =>
      patchIncidentStatus({ incident, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
