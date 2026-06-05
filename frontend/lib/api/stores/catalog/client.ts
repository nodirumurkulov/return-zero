import { apiClient } from "@/lib/api/client";
import {
  updateThresholdBodySchema,
  updateThresholdResponseSchema,
} from "@/lib/stores";

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
  await apiClient(`/api/stores/catalog/${input.product.id}/threshold`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  updateThresholdResponseSchema.parse({ ok: true });
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
