"use client";

import { useCallback } from "react";

import { fetchReplayOrders } from "@/lib/api/stores/analytics/replay/client";

export function useReplayOrders() {
  return useCallback(
    (opts: { readonly after: string; readonly limit?: number }) => fetchReplayOrders(opts),
    [],
  );
}
