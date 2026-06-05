"use client";

import { useMutation } from "@tanstack/react-query";

import { postAdvanceReplay, type AdvanceReplayInput } from "@/lib/api/stores/analytics/replay/client";

export type { AdvanceReplayInput, AdvanceReplayResult } from "@/lib/api/stores/analytics/replay/client";

export function useAdvanceReplay() {
  return useMutation({
    mutationFn: (input: AdvanceReplayInput) => postAdvanceReplay(input),
  });
}
