import {
  updateThresholdBodySchema,
  updateThresholdResponseSchema,
} from "@/lib/stores/analytics/catalog/schemas";

import { apiClient } from "../../../client";

export type ProductRef = {
  readonly id: string;
};

export type UpdateThresholdInput = {
  readonly product: ProductRef;
  readonly metricKey: string;
  readonly threshold: number;
};

export async function patchProductThreshold(input: UpdateThresholdInput): Promise<void> {
  const body = updateThresholdBodySchema.parse({
    metric_key: input.metricKey,
    threshold: input.threshold,
  });
  await apiClient(`/api/catalog/${input.product.id}/threshold`, {
    method: "PATCH",
    body,
    output: updateThresholdResponseSchema,
  });
}

export function parseThresholdFormData(formData: FormData): { metricKey: string; threshold: number } {
  const rawKey = formData.get("metric_key");
  const metricKey = typeof rawKey === "string" ? rawKey : "";
  const threshold = Number(formData.get("threshold"));
  if (!metricKey || Number.isNaN(threshold)) {
    throw new Error("Invalid threshold values");
  }
  return { metricKey, threshold };
}
