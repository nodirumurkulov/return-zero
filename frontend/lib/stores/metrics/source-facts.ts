import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export interface ProductSourceFacts {
  product_id: string;
  sales_revenue: number;
  sales_units: number;
  refunds_amount: number;
  refunds_count: number;
  ads_spend: number;
  ads_revenue: number;
  support_count: number;
}

export interface SourceFactsOpts {
  organizationId: string;
  windowDays: number;
  asOf?: string | null;
}

type SourceRow = Database["public"]["Functions"]["product_source_facts"]["Returns"][number];

function toFacts(row: SourceRow): ProductSourceFacts {
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

export async function getSourceFacts(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  windowDays: number,
  asOf?: string | null,
): Promise<Map<string, ProductSourceFacts>> {
  const args: Database["public"]["Functions"]["product_source_facts"]["Args"] = {
    p_organization_id: organizationId,
    p_window_days: windowDays,
    ...(asOf ? { p_asof: asOf } : {}),
  };
  const { data, error } = await supabase.rpc("product_source_facts", args);
  if (error) {
    throw new Error(
      `product_source_facts(${organizationId}, ${windowDays}) failed: ${error.message}`,
    );
  }
  const map = new Map<string, ProductSourceFacts>();
  for (const row of data ?? []) {
    const facts = toFacts(row);
    map.set(facts.product_id, facts);
  }
  return map;
}
