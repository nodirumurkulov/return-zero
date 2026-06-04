import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductSourceFacts } from "./types";

// PostgREST returns numeric columns as strings; coerce to numbers.
function toFacts(row: Record<string, unknown>): ProductSourceFacts {
  return {
    product_id: String(row.product_id),
    sales_revenue: Number(row.sales_revenue ?? 0),
    sales_units: Number(row.sales_units ?? 0),
    refunds_amount: Number(row.refunds_amount ?? 0),
    refunds_count: Number(row.refunds_count ?? 0),
    ads_spend: Number(row.ads_spend ?? 0),
    ads_revenue: Number(row.ads_revenue ?? 0),
    support_count: Number(row.support_count ?? 0),
  };
}

/**
 * Per-product source facts for a rolling window, indexed by product_id.
 *
 * Backed by the product_source_facts() SQL function — the generic, KPI-neutral
 * source layer. No business logic here; this is purely "what does the contract
 * data say about each product in this window."
 */
export async function getSourceFacts(
  supabase: SupabaseClient,
  windowDays: number
): Promise<Map<string, ProductSourceFacts>> {
  const { data, error } = await supabase.rpc("product_source_facts", {
    p_window_days: windowDays,
  });
  if (error) {
    throw new Error(`product_source_facts(${windowDays}) failed: ${error.message}`);
  }
  const map = new Map<string, ProductSourceFacts>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const facts = toFacts(row);
    map.set(facts.product_id, facts);
  }
  return map;
}
