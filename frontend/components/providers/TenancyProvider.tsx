"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";

import type { AppTenancy } from "@/lib/tenancy";

type TenancyContextValue = {
  tenancy: AppTenancy;
  setTenancy: (tenancy: AppTenancy) => void;
};

export const TenancyContext = createContext<TenancyContextValue | null>(null);

export function TenancyProvider({
  value: initialValue,
  children,
}: {
  value: AppTenancy;
  children: ReactNode;
}) {
  const [tenancy, setTenancy] = useState(initialValue);

  const contextValue = useMemo(
    () => ({
      tenancy,
      setTenancy,
    }),
    [tenancy],
  );

  return (
    <TenancyContext.Provider value={contextValue}>{children}</TenancyContext.Provider>
  );
}
