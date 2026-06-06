"use client";

import { useContext } from "react";

import { TenancyContext } from "@/components/providers/TenancyProvider";

export function useTenancyContext() {
  const context = useContext(TenancyContext);
  if (!context) {
    throw new Error("useTenancyContext must be used within TenancyProvider");
  }
  return context;
}
