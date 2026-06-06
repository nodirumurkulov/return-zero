"use client";

import { useMutation } from "@tanstack/react-query";

import { postAdvanceOrders, type AdvanceOrdersInput } from "@/lib/api/stores/orders/client";

export type { AdvanceOrdersInput, AdvanceOrdersInput as AdvanceReplayInput } from "@/lib/api/stores/orders/client";
export type { AdvanceOrdersResult as AdvanceReplayResult } from "@/lib/api/stores/orders/client";

export function useAdvanceOrders() {
  return useMutation({
    mutationFn: (input: AdvanceOrdersInput = {}) => postAdvanceOrders(input),
  });
}

export const useAdvanceReplay = useAdvanceOrders;
