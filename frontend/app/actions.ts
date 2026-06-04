"use server";

import { revalidatePath } from "next/cache";
import { isIncidentStatus } from "@/lib/incidents";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateThreshold(productId: string, formData: FormData) {
  const rawKpi = formData.get("kpi_name");
  const kpiName = typeof rawKpi === "string" ? rawKpi : "";
  const warningValue = Number(formData.get("warning_value"));
  const criticalValue = Number(formData.get("critical_value"));

  if (!kpiName || Number.isNaN(warningValue) || Number.isNaN(criticalValue)) {
    return { ok: false, error: "Invalid threshold values" };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("product_kpi_thresholds")
    .update({
      warning_value: warningValue,
      critical_value: criticalValue,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("kpi_name", kpiName);

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
