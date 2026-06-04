import { QueryClient, isServer } from "@tanstack/react-query";
import { cache } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

const browserQueryClientRef: { client: QueryClient | undefined } = { client: undefined };

export function getQueryClient() {
  if (isServer) {
    return cache(() => makeQueryClient())();
  }
  browserQueryClientRef.client ??= makeQueryClient();
  return browserQueryClientRef.client;
}
