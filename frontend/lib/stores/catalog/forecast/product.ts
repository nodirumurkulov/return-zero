// Per-product forecast bundle — assembles the monthly series into the business
// forecasts the agent and predictive detector consume.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MonthlyPoint } from "@/lib/stores/metrics/monthly-point";
import { getProductSeries } from "@/lib/stores/metrics/series";
import type { Database } from "@/lib/supabase/database.types";
import { forecastRate, forecastStockout, forecastValue } from "./predictors";
import type { PointForecast, StockoutForecast } from "./types";

export interface ProductForecastInputs {
  series: MonthlyPoint[];
  currentUnits: number;
  dailyOutflow: number;
  leadDays: number;
  bufferDays: number;
}

/** Load org-scoped series + inventory/outflow inputs for per-product forecasting. */
export async function loadProductForecastInputs(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
  months = 24,
): Promise<ProductForecastInputs> {
  const [series, { data: outflowRows }, { data: settingsRows }] = await Promise.all([
    getProductSeries(supabase, organizationId, productId, months),
    supabase.rpc("product_daily_outflow", {
      p_organization_id: organizationId,
      p_days: 28,
    }),
    supabase
      .from("business_settings")
      .select("key, value")
      .eq("organization_id", organizationId),
  ]);

  type OutflowRow = { product_id: string; current_balance: number | null; daily_outflow: number | null };
  const row = ((outflowRows ?? []) as OutflowRow[]).find((r) => r.product_id === productId);
  const settings = new Map((settingsRows ?? []).map((r) => [r.key, Number(r.value)]));

  return {
    series,
    currentUnits: Number(row?.current_balance ?? 0),
    dailyOutflow: Number(row?.daily_outflow ?? 0),
    leadDays: settings.get("lead_time_days") ?? 71,
    bufferDays: settings.get("buffer_days") ?? 14,
  };
}

export interface ProductForecast {
  product_id: string;
  stockout: StockoutForecast;
  refund_rate: PointForecast; // next-month refund value / revenue
  roas: PointForecast; // next-month ad revenue / ad spend
  revenue: PointForecast; // next-month revenue
  recent_revenue_avg: number; // mean of last 3 months
  recent_ad_spend_avg: number;
  avg_price: number;
}

export function forecastForProduct(
  series: MonthlyPoint[],
  currentUnits: number,
  dailyOutflow: number,
  leadDays: number,
  bufferDays: number
): ProductForecast {
  const revenue = series.map((p) => p.revenue);
  const refundAmt = series.map((p) => p.refund_amount);
  const adSpend = series.map((p) => p.ad_spend);
  const adRev = series.map((p) => p.ad_revenue);

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const totalUnits = series.reduce((a, p) => a + p.units, 0);
  const totalRev = revenue.reduce((a, b) => a + b, 0);

  return {
    product_id: series[0]?.product_id ?? "",
    stockout: forecastStockout({ currentUnits, dailyOutflow, leadDays, bufferDays }),
    refund_rate: forecastRate(refundAmt, revenue, 1),
    roas: forecastRate(adRev, adSpend, 1),
    revenue: forecastValue(revenue, 1),
    recent_revenue_avg: mean(revenue.slice(-3)),
    recent_ad_spend_avg: mean(adSpend.slice(-3)),
    avg_price: totalUnits > 0 ? totalRev / totalUnits : 0,
  };
}
