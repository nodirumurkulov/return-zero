import type { SupabaseClient } from "@supabase/supabase-js";

// One month of a product's time series (from product_monthly_series).
export interface MonthlyPoint {
  product_id: string;
  month: string; // YYYY-MM-DD (first of month)
  units: number;
  revenue: number;
  refund_amount: number;
  refund_count: number;
  ad_spend: number;
  ad_revenue: number;
}

function toPoint(r: Record<string, unknown>): MonthlyPoint {
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

/**
 * Per-product monthly time series, indexed by product_id and sorted ascending
 * by month (zero-filled — every product has a complete series). Generic over the
 * contract; this is the substrate the forecasting engine consumes.
 */
export async function getMonthlySeries(
  supabase: SupabaseClient,
  opts: { productId?: string; months?: number } = {}
): Promise<Map<string, MonthlyPoint[]>> {
  const months = opts.months ?? 24;

  // PostgREST caps RPC results (default 1000 rows); the full series is
  // products x months (~1488), so page through it to avoid silent truncation.
  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .rpc("product_monthly_series", { p_months: months })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`product_monthly_series failed: ${error.message}`);
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

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

/** A single product's monthly series, ascending by month. */
export async function getProductSeries(
  supabase: SupabaseClient,
  productId: string,
  months?: number
): Promise<MonthlyPoint[]> {
  return (await getMonthlySeries(supabase, { productId, months })).get(productId) ?? [];
}
