"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  parseThresholdFormData,
  patchProductThreshold,
  type ProductRef,
} from "@/lib/api/stores/catalog/client";

export type { ProductRef };

export function useUpdateThreshold(product: ProductRef) {
  const router = useRouter();

  return useMutation({
    mutationFn: (formData: FormData) => {
      const { metricKey, threshold } = parseThresholdFormData(formData);
      return patchProductThreshold({ product, metricKey, threshold });
    },
    onSuccess: () => {
      router.refresh();
    },
  });
}
