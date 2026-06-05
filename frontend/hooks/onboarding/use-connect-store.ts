"use client";

import { useMutation } from "@tanstack/react-query";

import { postConnectMockStore, postConnectShopifyStore } from "./api";

export type StorePlatform = "mock_csv" | "shopify";

export function useConnectStore() {
  return useMutation({
    mutationFn: (platform: StorePlatform) =>
      platform === "mock_csv" ? postConnectMockStore() : postConnectShopifyStore(),
  });
}
