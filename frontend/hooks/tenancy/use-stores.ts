"use client";

import { useTenancyContext } from "./use-tenancy-context";

export function useStores() {
  return useTenancyContext().tenancy.stores;
}
