import "server-only";

import { tool } from "ai";
import { z } from "zod";
import { loadBusinessProfile } from "@/lib/settings/queries";
import { computeProductMetrics } from "@/lib/stores/metrics/engine";
import { baselineStats, kpiRatioSeries } from "@/lib/stores/metrics/kpi-series";
import { getProductSeries } from "@/lib/stores/metrics/series";
import {
  confidenceFromN,
  confidenceInterval,
  zScore,
} from "@/lib/stores/metrics/spc";
import type { StoreScope } from "@/lib/tenancy/types";
import type { AgentSupabase } from "../types";
import { fetchMarketingContext } from "./marketing-tools";

export function createQuantTools(supabase: AgentSupabase, scope: StoreScope) {
  const { organizationId } = scope;
  return {
    getAnomalyProfile: tool({
      description:
        "Per-KPI statistical profile for the product: current value vs threshold, plus mean/σ/z-score/95% CI/confidence against the product's learned baseline. z and CI are null when no baseline exists (thin data).",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [metrics, mdRes, baselineRes, series] = await Promise.all([
          computeProductMetrics(supabase, scope, productId),
          supabase
            .from("metric_definitions")
            .select("id, metric_key")
            .eq("organization_id", organizationId),
          supabase
            .from("product_baselines")
            .select("metric_definition_id, mean, stddev, sample_n")
            .eq("organization_id", organizationId)
            .eq("product_id", productId),
          getProductSeries(supabase, scope, productId, 24),
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

    getRoasReallocation: tool({
      description:
        "Marketing efficiency: per-campaign ROAS, which campaigns are below the business min_roas, and a suggested £ reallocation from each low-ROAS campaign to the highest-ROAS one.",
      inputSchema: z.object({ productId: z.string() }),
      execute: async ({ productId }) => {
        const [ctx, profile] = await Promise.all([
          fetchMarketingContext(supabase, scope, productId),
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
                  shift_gbp: c.spend_gbp,
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
  };
}
