"use client";

import { useMutation } from "@tanstack/react-query";

import { postConnectMockStore, postConnectShopifyStore } from "@/lib/api/stores/connect/client";

export type StorePlatform = "mock_csv" | "shopify";

export function useConnectStore() {
  return useMutation({
    mutationFn: (platform: StorePlatform) =>
      platform === "mock_csv" ? postConnectMockStore() : postConnectShopifyStore(),
  });
}
