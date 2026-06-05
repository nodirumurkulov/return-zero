import "server-only";

import { forecastForProduct } from "@/lib/forecast/product";
import { getProductSeries } from "@/lib/metrics/series";
import type { AgentSupabase } from "../types";

type OutflowRow = {
  product_id: string;
  current_balance: number | null;
  daily_outflow: number | null;
};

export async function fetchForecastContext(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
) {
  const [series, { data: outflowRows }, { data: settingsRows }] = await Promise.all([
    getProductSeries(supabase, organizationId, productId, 24),
    supabase.rpc("product_daily_outflow", { p_organization_id: organizationId, p_days: 28 }),
    supabase
      .from("business_settings")
      .select("key, value")
      .eq("organization_id", organizationId),
  ]);

  const rows = (outflowRows ?? []) as OutflowRow[];
  const o = rows.find((r) => r.product_id === productId);
  const currentUnits = Number(o?.current_balance ?? 0);
  const dailyOutflow = Number(o?.daily_outflow ?? 0);
  const settings = new Map((settingsRows ?? []).map((r) => [r.key, Number(r.value)]));
  const leadDays = settings.get("lead_time_days") ?? 71;
  const bufferDays = settings.get("buffer_days") ?? 14;

  const fc = forecastForProduct(series, currentUnits, dailyOutflow, leadDays, bufferDays);
  const daysToStockout = isFinite(fc.stockout.days_to_stockout)
    ? Math.round(fc.stockout.days_to_stockout)
    : null;

  return {
    product_id: productId,
    current_units: currentUnits,
    days_to_stockout: daysToStockout,
    reorder_urgent: fc.stockout.reorder_urgent,
    refund_rate_forecast: +fc.refund_rate.point.toFixed(3),
    roas_forecast: +fc.roas.point.toFixed(2),
    revenue_forecast: Math.round(fc.revenue.point),
    recent_revenue_avg: Math.round(fc.recent_revenue_avg),
    lead_days: leadDays,
    methods: {
      stockout: fc.stockout.method,
      refund: fc.refund_rate.method,
      revenue: fc.revenue.method,
    },
  };
}
