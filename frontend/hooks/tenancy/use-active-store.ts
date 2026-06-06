"use client";

import { useTenancyContext } from "./use-tenancy-context";

export function useActiveStore() {
  return useTenancyContext().tenancy.activeStore;
}
