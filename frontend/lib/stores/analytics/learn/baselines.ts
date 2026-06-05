// BYOD Phase 2 — learn per-product baselines (RUN-80).
//
// After upload, learn what is "normal for this store" from its OWN monthly
// history, then derive per-product alert thresholds so detection fires on
// deviation from the client's baseline rather than seeded global defaults.
//
// Math only: the per-month KPI ratio series come straight from the engine
// (product_monthly_series via getMonthlySeries). We compute mean/stddev per
// product per KPI, persist them (the knowledge base), and write derived
// product_kpi_thresholds in the engine's override shape.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  baselineStats,
  kpiRatioSeries,
  LEARNABLE_KPIS,
  type BaselineStats,
} from "@/lib/stores/analytics/metrics/kpi-series";
import { getMonthlySeries } from "@/lib/stores/analytics/metrics/series";
import { createReplay } from "@/lib/stores/analytics/replay";
import type { Database } from "@/lib/supabase/database.types";

// Bands: alert when a product strays K standard deviations from its own normal.
const K = 2;

interface MetricDef {
  id: string;
  metric_key: string;
  direction: "above" | "below";
  default_threshold: number;
}

type Stats = BaselineStats;

// Derived per-product threshold. For "above" metrics (refund/return rate) the
// breach band is mean + K·σ, floored at the global default so we never alert
// looser than the baseline policy. For "below" metrics (ROAS) it's mean − K·σ,
// capped at the default (and never negative).
function derivedThreshold(def: MetricDef, s: Stats): number {
  const raw =
    def.direction === "above"
      ? Math.max(s.mean + K * s.stddev, def.default_threshold)
      : Math.min(Math.max(s.mean - K * s.stddev, 0), def.default_threshold);
  return Number(raw.toFixed(4));
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

export interface LearnResult {
  baselines: number;
  thresholds: number;
  products: number;
}

export async function learnBaselines(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<LearnResult> {
  const [{ data: defRows, error: defErr }, { data: settingRows }] = await Promise.all([
    supabase
      .from("metric_definitions")
      .select("id, metric_key, direction, default_threshold")
      .eq("organization_id", organizationId)
      .eq("enabled", true),
    supabase
      .from("business_settings")
      .select("key, value")
      .eq("organization_id", organizationId),
  ]);
  if (defErr) throw new Error(`metric_definitions read failed: ${defErr.message}`);

  const settings = new Map((settingRows ?? []).map((s) => [String(s.key), Number(s.value)]));
  const minRoas = settings.get("min_roas");

  const defs = (defRows ?? [])
    .map((d) => ({
      id: d.id,
      metric_key: d.metric_key,
      direction: d.direction === "below" ? ("below" as const) : ("above" as const),
      default_threshold: d.default_threshold,
    }))
    .filter((d): d is MetricDef => (LEARNABLE_KPIS as readonly string[]).includes(d.metric_key))
    .map((d) =>
      d.metric_key === "ad_roas" && minRoas !== undefined && Number.isFinite(minRoas)
        ? { ...d, default_threshold: minRoas }
        : d,
    );

  // Learn "normal" on the BASELINE period only — everything before the live
  // stream window — so the anomalies we're about to replay don't pollute it.
  const baselineEnd = await createReplay(supabase).streamStartDate(organizationId);
  const seriesByProduct = await getMonthlySeries(supabase, { organizationId, months: 24 });

  // One (product, metric) entry per KPI that has enough history to be meaningful.
  const computed = Array.from(seriesByProduct.entries()).flatMap(([productId, series]) => {
    const baselineSeries = baselineEnd ? series.filter((p) => p.month < baselineEnd) : series;
    return defs
      .map((def) => ({ productId, def, s: baselineStats(kpiRatioSeries(baselineSeries, def.metric_key)) }))
      .filter((e) => e.s.n >= 3);
  });

  const baselineRows = computed.map(({ productId, def, s }) => ({
    organization_id: organizationId,
    product_id: productId,
    metric_definition_id: def.id,
    mean: Number(s.mean.toFixed(6)),
    stddev: Number(s.stddev.toFixed(6)),
    sample_n: s.n,
  }));

  const thresholdRows = computed.map(({ productId, def, s }) => ({
    organization_id: organizationId,
    product_id: productId,
    metric_definition_id: def.id,
    threshold: derivedThreshold(def, s),
    direction: def.direction,
    active: true,
  }));

  await Promise.all(
    chunk(baselineRows, 500).map(async (rows) => {
      const { error } = await supabase.from("product_baselines").upsert(rows, {
        onConflict: "organization_id,product_id,metric_definition_id",
      });
      if (error) throw new Error(`product_baselines upsert failed: ${error.message}`);
    }),
  );

  await Promise.all(
    chunk(thresholdRows, 500).map(async (rows) => {
      const { error } = await supabase.from("product_kpi_thresholds").upsert(rows, {
        onConflict: "organization_id,product_id,metric_definition_id",
      });
      if (error) throw new Error(`product_kpi_thresholds upsert failed: ${error.message}`);
    }),
  );

  return {
    baselines: baselineRows.length,
    thresholds: thresholdRows.length,
    products: seriesByProduct.size,
  };
}
