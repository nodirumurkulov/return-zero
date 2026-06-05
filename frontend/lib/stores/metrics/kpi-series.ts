// Shared, pure KPI-baseline helpers — the single source of truth for turning a
// product's monthly series into a per-KPI ratio series and its (mean, σ, n)
// baseline. Used both by the learn step (which persists baselines) and the Quant
// Analyst's anomaly tool (which falls back to on-the-fly stats when no baseline
// row exists yet). Pure: no DB, no `server-only`, trivially testable.

import type { MetricKey } from "../catalog/types";
import type { MonthlyPoint } from "./monthly-point";

/** Ratio KPIs derivable from monthly series. */
export const LEARNABLE_KPIS = ["refund_rate", "return_rate", "ad_roas"] as const;

export interface BaselineStats {
  mean: number;
  stddev: number; // population standard deviation (÷n) — matches persisted baselines
  n: number;
}

/**
 * Per-month ratio for a KPI, skipping months whose denominator is zero (the
 * ratio is undefined that month, not 0). Returns [] for non-ratio KPIs.
 */
export function kpiRatioSeries(series: MonthlyPoint[], metricKey: MetricKey): number[] {
  if (metricKey === "support_volume") return [];
  return series
    .map((p): number | null => {
      if (metricKey === "refund_rate") return p.revenue > 0 ? p.refund_amount / p.revenue : null;
      if (metricKey === "return_rate") return p.units > 0 ? p.refund_count / p.units : null;
      if (metricKey === "ad_roas") return p.ad_spend > 0 ? p.ad_revenue / p.ad_spend : null;
      return null;
    })
    .filter((v): v is number => v !== null);
}

/** Mean, population stddev, and count of a numeric series (non-finite values dropped). */
export function baselineStats(values: number[]): BaselineStats {
  const xs = values.filter((v) => Number.isFinite(v));
  if (xs.length === 0) return { mean: 0, stddev: 0, n: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return { mean, stddev: Math.sqrt(variance), n: xs.length };
}
