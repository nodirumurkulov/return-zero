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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("product_kpi_thresholds")
    .upsert(
      { product_id: productId, metric_key: metricKey, threshold, active: true },
      { onConflict: "product_id,metric_key" },
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const payload: { status: string; resolved_at: string | null } = {
    status,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("incidents").update(payload).eq("id", incidentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { ok: true };
}
