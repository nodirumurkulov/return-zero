"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateThreshold(productId: string, formData: FormData) {
  const metricKey = String(formData.get("metric_key") ?? "");
  const threshold = Number(formData.get("threshold"));

  if (!metricKey || Number.isNaN(threshold)) {
    return { ok: false, error: "Invalid threshold value" };
  }

  const supabase = createServiceClient();
  // Engine-shape per-product override (global default lives on the definition).
  const { error } = await supabase
    .from("product_kpi_thresholds")
    .upsert(
      { product_id: productId, metric_key: metricKey, threshold, active: true },
      { onConflict: "product_id,metric_key" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
  return { ok: true };
}

export async function updateIncidentStatus(incidentId: string, status: string) {
  const supabase = createServiceClient();
  const payload: { status: string; resolved_at?: string | null } = { status };

  if (status === "resolved") {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("incidents")
    .update(payload)
    .eq("id", incidentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { ok: true };
}
