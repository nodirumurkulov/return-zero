import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
  confidenceFromN,
  confidenceInterval,
  zScore,
} from "@/lib/detection/anomaly";
import { marginBridge } from "@/lib/forecast/margin";
import { recommendReorder } from "@/lib/forecast/reorder";
import { computeProductMetrics } from "@/lib/metrics/engine";
import { baselineStats, kpiRatioSeries } from "@/lib/metrics/kpi-series";
import { getProductSeries } from "@/lib/metrics/series";
import { loadBusinessProfile, loadProductCostRows } from "@/lib/settings/queries";
import type { AgentSupabase } from "../types";
import { fetchForecastContext } from "./forecasting-tools";
import { fetchMarketingContext } from "./marketing-tools";

const DEMAND_WINDOW_DAYS = 90;

/** Build a zero-filled daily-demand array (units sold/day) from inventory_movements. */
async function dailyDemandSeries(
  supabase: AgentSupabase,
  organizationId: string,
  productId: string,
): Promise<number[]> {
  const { data: variants } = await supabase
    .from("variants")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("product_id", productId);
  const variantIds = (variants ?? []).map((v) => v.id);
  if (variantIds.length === 0) return [];

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select("date, quantity_delta")
    .eq("organization_id", organizationId)
    .in("variant_id", variantIds)
    .order("date", { ascending: false });

  const rows = (movements ?? []).filter((m) => m.date);
  if (rows.length === 0) return [];

  // Sum outflow (negative deltas) per calendar day.
  const outflowByDay = new Map<string, number>();
  for (const m of rows) {
    const delta = Number(m.quantity_delta ?? 0);
    if (delta >= 0) continue;
    const day = String(m.date);
    outflowByDay.set(day, (outflowByDay.get(day) ?? 0) - delta);
  }

  // Zero-fill the last DEMAND_WINDOW_DAYS up to the most recent movement date.
  const maxDate = new Date(String(rows[0].date));
  return Array.from({ length: DEMAND_WINDOW_DAYS }, (_, idx) => {
    const offset = DEMAND_WINDOW_DAYS - 1 - idx;
    const d = new Date(maxDate);
    d.setUTCDate(d.getUTCDate() - offset);
    const key = d.toISOString().split("T")[0];
    return outflowByDay.get(key) ?? 0;
  });
}

export function createQuantTools(supabase: AgentSupabase, organizationId: string) {
  return {
    getAnomalyProfile: tool({
      description:
        "Per-KPI statistical profile for the product: current value vs threshold, plus mean/σ/z-score/95% CI/confidence against the product's learned baseline. z and CI are null when no baseline exists (thin data).",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        // product_baselines is keyed by metric_definition_id, so resolve it back
        // to metric_key via metric_definitions before matching the live metrics.
        const [metrics, mdRes, baselineRes, series] = await Promise.all([
          computeProductMetrics(supabase, organizationId, productId),
          supabase
            .from("metric_definitions")
            .select("id, metric_key")
            .eq("organization_id", organizationId),
          supabase
            .from("product_baselines")
            .select("metric_definition_id, mean, stddev, sample_n")
            .eq("organization_id", organizationId)
            .eq("product_id", productId),
          getProductSeries(supabase, organizationId, productId, 24),
        ]);
        const keyByDefId = new Map(
          (mdRes.data ?? []).map((d) => [String(d.id), String(d.metric_key)]),
        );
        const baselineByKey = new Map(
          (baselineRes.data ?? []).flatMap((r) => {
            const key = keyByDefId.get(String(r.metric_definition_id));
            return key ? ([[key, r]] as const) : [];
          }),
        );

        const kpis = metrics.map((m) => {
          const value = m.value ?? 0;
          // Prefer the learned baseline (computed over the clean baseline period);
          // fall back to on-the-fly stats from the monthly series so the analyst
          // has numbers even before the learn step has run on an upload. Either
          // way confidence is graded honestly from the sample size.
          const stored = baselineByKey.get(m.metric_key);
          const stats = stored
            ? { mean: Number(stored.mean), stddev: Number(stored.stddev), n: Number(stored.sample_n) }
            : (() => {
                const s = baselineStats(kpiRatioSeries(series, m.metric_key));
                return s.n > 0 ? s : null;
              })();
          const baselineSource = stored ? "learned" : stats ? "series" : "none";

          return {
            metric_key: m.metric_key,
            display_name: m.display_name,
            unit: m.unit,
            value: m.value,
            threshold: m.threshold,
            direction: m.direction,
            breached: m.status === "critical",
            baseline_source: baselineSource,
            mean: stats ? stats.mean : null,
            sigma: stats ? stats.stddev : null,
            sample_n: stats ? stats.n : null,
            z_score: stats ? zScore(value, stats.mean, stats.stddev) : null,
            ci: stats ? confidenceInterval(stats.mean, stats.stddev, stats.n) : null,
            confidence: stats ? confidenceFromN(stats.n) : "none",
          };
        });

        return { product_id: productId, kpis };
      },
    }),

    getReorderPlan: tool({
      description:
        "Newsvendor reorder plan from observed daily demand variability: recommended order quantity, safety stock at 95% service, current units, and days-to-stockout. Complements the deterministic stockout forecast.",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [profile, dailyDemand, forecast] = await Promise.all([
          loadBusinessProfile(supabase, organizationId),
          dailyDemandSeries(supabase, organizationId, productId),
          fetchForecastContext(supabase, organizationId, productId),
        ]);
        const plan = recommendReorder({
          dailyDemand,
          currentUnits: forecast.current_units,
          leadDays: profile.leadTimeDays,
          bufferDays: profile.bufferDays,
        });
        return {
          product_id: productId,
          ...plan,
          current_units: forecast.current_units,
          days_to_stockout: forecast.days_to_stockout,
          lead_days: profile.leadTimeDays,
          buffer_days: profile.bufferDays,
        };
      },
    }),

    getMarginBridge: tool({
      description:
        "Decompose net-margin-after-ads against the target margin into drivers (price headroom, COGS, discounts, refund drag, ad cost) in margin-points and £, ranked by impact.",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [series, costRows, profile, { data: lineItems }] = await Promise.all([
          getProductSeries(supabase, organizationId, productId, 24),
          loadProductCostRows(supabase, organizationId),
          loadBusinessProfile(supabase, organizationId),
          supabase
            .from("line_items")
            .select("total_discount")
            .eq("organization_id", organizationId)
            .eq("product_id", productId),
        ]);

        const costPerUnit = costRows.find((c) => c.productId === productId)?.costPerUnit ?? 0;
        const units = series.reduce((a, p) => a + p.units, 0);
        const revenue = series.reduce((a, p) => a + p.revenue, 0);
        const refunds = series.reduce((a, p) => a + p.refund_amount, 0);
        const adSpend = series.reduce((a, p) => a + p.ad_spend, 0);
        const discounts = (lineItems ?? []).reduce(
          (a, l) => a + Number(l.total_discount ?? 0),
          0,
        );

        const bridge = marginBridge({
          revenue,
          cogs: units * costPerUnit,
          discounts,
          refunds,
          adSpend,
          targetMarginPct: profile.targetMarginPct,
        });
        return { product_id: productId, cost_per_unit: costPerUnit, units, ...bridge };
      },
    }),

    getRoasReallocation: tool({
      description:
        "Marketing efficiency: per-campaign ROAS, which campaigns are below the business min_roas, and a suggested £ reallocation from each low-ROAS campaign to the highest-ROAS one.",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [ctx, profile] = await Promise.all([
          fetchMarketingContext(supabase, organizationId, productId),
          loadBusinessProfile(supabase, organizationId),
        ]);
        const minRoas = profile.minRoas;
        const summary = ctx.campaign_summary;
        const belowMin = summary.filter((c) => c.roas < minRoas);
        const best = summary.reduce<(typeof summary)[number] | null>(
          (top, c) => (top === null || c.roas > top.roas ? c : top),
          null,
        );

        const suggestedShifts =
          best && best.roas >= minRoas
            ? belowMin
                .filter((c) => c.campaign !== best.campaign)
                .map((c) => ({
                  from_campaign: c.campaign,
                  to_campaign: best.campaign,
                  shift_gbp: c.spend_gbp, // capped at the low campaign's own spend
                  from_roas: c.roas,
                  to_roas: best.roas,
                }))
            : [];

        return {
          product_id: productId,
          min_roas: minRoas,
          campaign_summary: summary,
          below_min_campaigns: belowMin,
          best_campaign: best,
          suggested_shifts: suggestedShifts,
        };
      },
    }),

    getForecastSnapshot: tool({
      description:
        "Forward-looking deterministic forecasts: days-to-stockout, next-month refund rate, ROAS, and revenue (numbers are final — do not change them).",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => fetchForecastContext(supabase, organizationId, productId),
    }),
  };
}
