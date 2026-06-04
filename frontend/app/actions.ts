"use server";

import { revalidatePath } from "next/cache";
import { isIncidentStatus } from "@/lib/incidents";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateThreshold(productId: string, formData: FormData) {
  const rawKpi = formData.get("kpi_name");
  const kpiName = typeof rawKpi === "string" ? rawKpi : "";
  // The editor still posts warning/critical; the engine uses a single threshold,
  // so we persist the critical value as the per-product override threshold.
  const criticalValue = Number(formData.get("critical_value"));

  if (!kpiName || Number.isNaN(criticalValue)) {
    return { ok: false, error: "Invalid threshold value" };
  }

  const metricKey = kpiName === "support_tickets" ? "support_volume" : kpiName;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("product_kpi_thresholds")
    .upsert(
      { product_id: productId, metric_key: metricKey, threshold: criticalValue, active: true },
      { onConflict: "product_id,metric_key" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
  return { ok: true };
}

export async function updateIncidentStatus(incidentId: string, status: string) {
  if (!isIncidentStatus(status)) {
    return { ok: false, error: "Invalid incident status" };
  }

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
