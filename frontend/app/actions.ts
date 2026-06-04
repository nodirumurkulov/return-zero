"use server";

import { revalidatePath } from "next/cache";
import { isIncidentStatus } from "@/lib/incident-status";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateThreshold(productId: string, formData: FormData) {
  const kpiName = String(formData.get("kpi_name") ?? "");
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
  const payload: { status: string; resolved_at: string | null } = {
    status,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("incidents")
    .update(payload)
    .eq("id", incidentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { ok: true };
}
