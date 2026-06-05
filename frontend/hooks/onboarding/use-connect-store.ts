"use client";

import { useMutation } from "@tanstack/react-query";

import { postConnectStore } from "./api";

export function useConnectStore() {
  return useMutation({
    mutationFn: postConnectStore,
  });
}
