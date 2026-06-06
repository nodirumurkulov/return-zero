import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import type { MonthlyPoint, SeriesOpts } from "./monthly-point";

export type { MonthlyPoint, SeriesOpts };

type SeriesRow = Database["public"]["Functions"]["product_monthly_series"]["Returns"][number];

function toPoint(r: SeriesRow): MonthlyPoint {
  return {
    product_id: String(r.product_id),
    month: String(r.month),
    units: Number(r.units ?? 0),
    revenue: Number(r.revenue ?? 0),
    refund_amount: Number(r.refund_amount ?? 0),
    refund_count: Number(r.refund_count ?? 0),
    ad_spend: Number(r.ad_spend ?? 0),
    ad_revenue: Number(r.ad_revenue ?? 0),
  };
}

export async function getMonthlySeries(
  supabase: SupabaseClient<Database>,
  opts: SeriesOpts,
): Promise<Map<string, MonthlyPoint[]>> {
  const months = opts.months ?? 24;

  const pageSize = 1000;
  const fetchPage = async (from: number): Promise<SeriesRow[]> => {
    const args: Database["public"]["Functions"]["product_monthly_series"]["Args"] = {
      p_store_id: opts.scope.storeId,
      p_months: months,
    };
    const { data, error } = await supabase.rpc("product_monthly_series", args).range(from, from + pageSize - 1);
    if (error) throw new Error(`product_monthly_series failed: ${error.message}`);
    const page = data ?? [];
    if (page.length < pageSize) return page;
    return [...page, ...(await fetchPage(from + pageSize))];
  };
  const rows = await fetchPage(0);

  const byProduct = new Map<string, MonthlyPoint[]>();
  for (const row of rows) {
    const p = toPoint(row);
    if (opts.productId && p.product_id !== opts.productId) continue;
    const list = byProduct.get(p.product_id);
    if (list) list.push(p);
    else byProduct.set(p.product_id, [p]);
  }
  for (const list of Array.from(byProduct.values())) {
    list.sort((a, b) => a.month.localeCompare(b.month));
  }
  return byProduct;
}

export async function getProductSeries(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
  productId: string,
  months?: number,
): Promise<MonthlyPoint[]> {
  return (
    (await getMonthlySeries(supabase, { scope, productId, months })).get(productId) ?? []
  );
}
