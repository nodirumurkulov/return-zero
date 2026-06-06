"use client";

import { useTenancyContext } from "./use-tenancy-context";

export function useOrganization() {
  return useTenancyContext().tenancy.organization;
}
