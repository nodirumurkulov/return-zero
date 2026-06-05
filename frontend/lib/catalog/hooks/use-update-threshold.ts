"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { updateThresholdApi, type ProductRef } from "@/lib/catalog/api";

export type { ProductRef } from "@/lib/catalog/api";

export function useUpdateThreshold(product: ProductRef) {
  const router = useRouter();

  return useMutation({
    mutationFn: (formData: FormData) => updateThresholdApi({ product, formData }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
