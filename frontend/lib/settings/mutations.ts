import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { BusinessProfileInput } from "./schemas";

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export async function saveBusinessProfile(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  input: BusinessProfileInput,
): Promise<void> {
  const { error: profileErr } = await supabase.from("business_profile").upsert(
    {
      organization_id: organizationId,
      platform: input.platform,
      store_name: input.storeName,
      primary_goal: input.primaryGoal,
      hero_product_ids: input.heroProductIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
  if (profileErr) throw new Error(`business_profile save failed: ${profileErr.message}`);

  const settingsRows = [
    {
      organization_id: organizationId,
      key: "target_margin",
      value: input.targetMarginPct / 100,
      label: "Target gross margin",
    },
    {
      organization_id: organizationId,
      key: "min_roas",
      value: input.minRoas,
      label: "Minimum acceptable ROAS",
    },
    {
      organization_id: organizationId,
      key: "lead_time_days",
      value: input.leadTimeDays,
      label: "Supplier lead time (days)",
    },
    {
      organization_id: organizationId,
      key: "buffer_days",
      value: input.bufferDays,
      label: "Safety buffer (days)",
    },
  ];

  for (const row of settingsRows) {
    const { error } = await supabase
      .from("business_settings")
      .upsert(row, { onConflict: "organization_id,key" });
    if (error) throw new Error(`business_settings save failed: ${error.message}`);
  }

  const { error: roasRuleErr } = await supabase
    .from("forecast_rules")
    .update({ threshold: input.minRoas })
    .eq("organization_id", organizationId)
    .eq("rule_key", "roas_decay");
  if (roasRuleErr) throw new Error(`forecast_rules update failed: ${roasRuleErr.message}`);

  const { error: metricErr } = await supabase
    .from("metric_definitions")
    .update({ default_threshold: input.minRoas })
    .eq("organization_id", organizationId)
    .eq("metric_key", "ad_roas");
  if (metricErr) throw new Error(`metric_definitions update failed: ${metricErr.message}`);

  const { error: deleteErr } = await supabase
    .from("product_cost_overrides")
    .delete()
    .eq("organization_id", organizationId);
  if (deleteErr) throw new Error(`product_cost_overrides clear failed: ${deleteErr.message}`);

  const costRows = input.productCosts.filter((r) => Number.isFinite(r.costPerUnit));
  for (const rows of chunk(costRows, 200)) {
    const { error } = await supabase.from("product_cost_overrides").upsert(
      rows.map((r) => ({
        organization_id: organizationId,
        product_id: r.productId,
        cost_per_unit: r.costPerUnit,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "organization_id,product_id" },
    );
    if (error) throw new Error(`product_cost_overrides save failed: ${error.message}`);
  }
}
