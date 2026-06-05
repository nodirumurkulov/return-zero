"use client";

import { useMutation } from "@tanstack/react-query";
import { updateThresholdApi, type ProductRef } from "@/lib/catalog/api";

export type { ProductRef } from "@/lib/catalog/api";

export function useUpdateThreshold(product: ProductRef) {
  return useMutation({
    mutationFn: (formData: FormData) => updateThresholdApi({ product, formData }),
  });
}
