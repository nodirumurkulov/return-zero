import "server-only";
import { forecastForProduct } from "@/lib/forecast/product";
import { callLLMJson } from "@/lib/llm";
import { getProductSeries } from "@/lib/metrics/series";
import { agentFindingLlmSchema } from "./schemas";
import type { AgentSupabase, LlmAgentFinding } from "./types";

export async function runForecastingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const [series, { data: outflowRows }, { data: settingsRows }] = await Promise.all([
    getProductSeries(supabase, productId, 24),
    supabase.rpc("product_daily_outflow", { p_days: 28 }),
    supabase.from("business_settings").select("key, value"),
  ]);

  type OutflowRow = { product_id: string; current_balance: number | null; daily_outflow: number | null };
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

  const context = {
    product_id: productId,
    current_units: currentUnits,
    days_to_stockout: daysToStockout,
    reorder_urgent: fc.stockout.reorder_urgent,
    refund_rate_forecast: +fc.refund_rate.point.toFixed(3),
    roas_forecast: +fc.roas.point.toFixed(2),
    revenue_forecast: Math.round(fc.revenue.point),
    recent_revenue_avg: Math.round(fc.recent_revenue_avg),
    methods: { stockout: fc.stockout.method, refund: fc.refund_rate.method, revenue: fc.revenue.method },
  };

  const result = await callLLMJson(
    [
      {
        role: "system",
        content: `You are the Forecasting Agent for Resolve. You are given DETERMINISTIC forecasts that are already computed — never change the numbers. Summarise the forward-looking risk in 1-2 sentences with the exact figures. Respond with JSON: { "summary": "...", "detail": {...} }.`,
      },
      { role: "user", content: `Forecasts for product ${productId}:\n${JSON.stringify(context, null, 2)}` },
    ],
    agentFindingLlmSchema,
  );

  const fallback =
    daysToStockout !== null && fc.stockout.reorder_urgent
      ? `Forecast stockout in ~${daysToStockout} days — reorder now (lead ${leadDays}d).`
      : `Refund rate trending to ${(fc.refund_rate.point * 100).toFixed(1)}%; revenue forecast £${Math.round(fc.revenue.point)}.`;

  return {
    agent_name: "Forecasting Agent",
    agent_icon: "🔮",
    summary: result?.summary ?? fallback,
    detail: result?.detail ?? context,
  };
}
