import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessProfileInput } from "./schemas";

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export async function saveBusinessProfile(
  supabase: SupabaseClient,
  input: BusinessProfileInput,
): Promise<void> {
  const { error: profileErr } = await supabase.from("business_profile").upsert(
    {
      id: true,
      platform: input.platform,
      store_name: input.storeName,
      primary_goal: input.primaryGoal,
      hero_product_ids: input.heroProductIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileErr) throw new Error(`business_profile save failed: ${profileErr.message}`);

  const settingsRows = [
    { key: "target_margin", value: input.targetMarginPct / 100, label: "Target gross margin" },
    { key: "min_roas", value: input.minRoas, label: "Minimum acceptable ROAS" },
    { key: "lead_time_days", value: input.leadTimeDays, label: "Supplier lead time (days)" },
    { key: "buffer_days", value: input.bufferDays, label: "Safety buffer (days)" },
  ];

  for (const row of settingsRows) {
    const { error } = await supabase.from("business_settings").upsert(row, { onConflict: "key" });
    if (error) throw new Error(`business_settings save failed: ${error.message}`);
  }

  const { error: roasRuleErr } = await supabase
    .from("forecast_rules")
    .update({ threshold: input.minRoas })
    .eq("rule_key", "roas_decay");
  if (roasRuleErr) throw new Error(`forecast_rules update failed: ${roasRuleErr.message}`);

  const { error: metricErr } = await supabase
    .from("metric_definitions")
    .update({ default_threshold: input.minRoas })
    .eq("metric_key", "ad_roas");
  if (metricErr) throw new Error(`metric_definitions update failed: ${metricErr.message}`);

  await supabase.from("product_cost_overrides").delete().not("product_id", "is", null);

  const costRows = input.productCosts.filter((r) => Number.isFinite(r.costPerUnit));
  for (const rows of chunk(costRows, 200)) {
    const { error } = await supabase.from("product_cost_overrides").upsert(
      rows.map((r) => ({
        product_id: r.productId,
        cost_per_unit: r.costPerUnit,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "product_id" },
    );
    if (error) throw new Error(`product_cost_overrides save failed: ${error.message}`);
  }
}
