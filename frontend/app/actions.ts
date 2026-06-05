"use server";

import { revalidatePath } from "next/cache";
import { isIncidentStatus } from "@/lib/incidents";
import { tryRequireOrganizationId } from "@/lib/organizations";
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

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return { ok: false, error: org.error };
  }
  const { organizationId } = org;

  const { data: metricDef, error: defErr } = await supabase
    .from("metric_definitions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("metric_key", metricKey)
    .maybeSingle();

  if (defErr || !metricDef) {
    return { ok: false, error: defErr?.message ?? "Unknown metric" };
  }

  const { error } = await supabase.from("product_kpi_thresholds").upsert(
    {
      organization_id: organizationId,
      product_id: productId,
      metric_definition_id: metricDef.id,
      threshold,
      active: true,
    },
    { onConflict: "organization_id,product_id,metric_definition_id" },
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

  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) {
    return { ok: false, error: org.error };
  }
  const { organizationId } = org;

  const payload = {
    status,
    resolved_at: status === "resolved" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("incidents")
    .update(payload)
    .eq("id", incidentId)
    .eq("organization_id", organizationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  return { ok: true };
}
