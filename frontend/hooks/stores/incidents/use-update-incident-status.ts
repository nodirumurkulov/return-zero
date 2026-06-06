"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  patchIncidentStatus,
  type PatchIncidentStatusInput,
} from "@/lib/api/stores/incidents/client";

export type { PatchIncidentStatusInput as UpdateIncidentStatusInput };

export function useUpdateIncidentStatus() {
  const router = useRouter();

  return useMutation({
    mutationFn: patchIncidentStatus,
    onSuccess: () => {
      router.refresh();
    },
  });
}
