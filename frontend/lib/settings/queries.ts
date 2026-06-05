import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { BusinessProfile, ProductCostRow } from "./types";

const DEFAULTS = {
  targetMarginPct: 55,
  minRoas: 3,
  leadTimeDays: 71,
  bufferDays: 14,
} as const;

function settingNum(map: Map<string, number>, key: string, fallback: number): number {
  const v = map.get(key);
  return v !== undefined && Number.isFinite(v) ? v : fallback;
}

export async function loadBusinessProfile(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<BusinessProfile> {
  const [{ data: profileRow }, { data: settingRows }] = await Promise.all([
    supabase
      .from("business_profile")
      .select("platform, store_name, primary_goal, hero_product_ids")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    supabase
      .from("business_settings")
      .select("key, value")
      .eq("organization_id", organizationId),
  ]);

  const settings = new Map((settingRows ?? []).map((r) => [String(r.key), Number(r.value)]));

  return {
    platform: (profileRow?.platform as BusinessProfile["platform"]) ?? "shopify",
    storeName: String(profileRow?.store_name ?? ""),
    primaryGoal: (profileRow?.primary_goal as BusinessProfile["primaryGoal"]) ?? "growth",
    targetMarginPct: settingNum(settings, "target_margin", DEFAULTS.targetMarginPct / 100) * 100,
    minRoas: settingNum(settings, "min_roas", DEFAULTS.minRoas),
    leadTimeDays: settingNum(settings, "lead_time_days", DEFAULTS.leadTimeDays),
    bufferDays: settingNum(settings, "buffer_days", DEFAULTS.bufferDays),
    heroProductIds: (profileRow?.hero_product_ids as string[] | null) ?? [],
  };
}

export async function loadProductCostRows(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ProductCostRow[]> {
  const [{ data: products }, { data: variants }, { data: poLines }, { data: overrides }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, title")
        .eq("organization_id", organizationId)
        .order("title"),
      supabase.from("variants").select("id, product_id").eq("organization_id", organizationId),
      supabase
        .from("po_line_items")
        .select("variant_id, landed_cost_per_unit_gbp")
        .eq("organization_id", organizationId),
      supabase
        .from("product_cost_overrides")
        .select("product_id, cost_per_unit")
        .eq("organization_id", organizationId),
    ]);

  const overrideByProduct = new Map(
    (overrides ?? []).map((r) => [String(r.product_id), Number(r.cost_per_unit)]),
  );
  const variantToProduct = new Map(
    (variants ?? []).map((v) => [String(v.id), String(v.product_id)]),
  );

  const defaultCostByProduct = new Map<string, number>();
  for (const line of poLines ?? []) {
    const productId = variantToProduct.get(String(line.variant_id));
    const cost = Number(line.landed_cost_per_unit_gbp);
    if (!productId || !Number.isFinite(cost)) continue;
    const prev = defaultCostByProduct.get(productId);
    if (prev === undefined || cost > prev) defaultCostByProduct.set(productId, cost);
  }

  return (products ?? []).map((p) => {
    const productId = String(p.id);
    const defaultCost = defaultCostByProduct.get(productId) ?? null;
    const costPerUnit = overrideByProduct.get(productId) ?? defaultCost ?? 0;
    return {
      productId,
      title: String(p.title ?? productId),
      defaultCost,
      costPerUnit,
    };
  });
}
