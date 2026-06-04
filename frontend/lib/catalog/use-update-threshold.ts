"use client";

import { useMutation } from "@tanstack/react-query";
import { updateThreshold } from "@/app/actions";

export type ProductRef = {
  readonly id: string;
};

export function useUpdateThreshold(product: ProductRef) {
  return useMutation({
    mutationFn: (formData: FormData) => updateThreshold(product.id, formData),
  });
}
