"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { switchActiveStore } from "@/lib/api/stores/connection/client";

import { useTenancyContext } from "./use-tenancy-context";

export function useSwitchStore() {
  const router = useRouter();
  const { setTenancy } = useTenancyContext();

  return useMutation({
    mutationFn: (storeId: string) => switchActiveStore(storeId),
    onSuccess: (tenancy) => {
      setTenancy(tenancy);
      router.refresh();
    },
  });
}
