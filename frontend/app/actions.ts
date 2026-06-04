"use server";

import { revalidatePath } from "next/cache";
import { isIncidentStatus } from "@/lib/incidents";
import { createClient } from "@/lib/supabase/server";

export async function updateThreshold(productId: string, formData: FormData) {
  const rawKey = formData.get("metric_key");
  const metricKey = typeof rawKey === "string" ? rawKey : "";
  const threshold = Number(formData.get("threshold"));

  if (!metricKey || Number.isNaN(threshold)) {
    return { ok: false, error: "Invalid threshold values" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_kpi_thresholds")
    .update({ threshold })
    .eq("product_id", productId)
    .eq("metric_key", metricKey);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/catalog/${productId}`);
  revalidatePath("/catalog");
  return { ok: true };
}

export async function updateIncidentStatus(incidentId: string, status: string) {
  if (!isIncidentStatus(status)) {
    return { ok: false, error: "Invalid incident status" };
  }

  const supabase = await createClient();
  const payload: { status: string; resolved_at?: string | null } = { status };

  if (status === "resolved") {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("incidents").update(payload).eq("id", incidentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { ok: true };
}
