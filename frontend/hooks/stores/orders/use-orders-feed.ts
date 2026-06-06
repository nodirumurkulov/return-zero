"use client";

import { useCallback } from "react";

import { fetchOrdersFeed } from "@/lib/api/stores/orders/client";

export function useOrdersFeed() {
  return useCallback(
    (opts: { readonly after: string; readonly limit?: number }) => fetchOrdersFeed(opts),
    [],
  );
}

export const useReplayOrders = useOrdersFeed;
