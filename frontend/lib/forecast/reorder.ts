// Newsvendor-style reorder planning — pure math over a daily-demand array.
// Complements forecastStockout (days-to-stockout from burn rate, no variance) by
// sizing a safety buffer from the demand variability we observe in
// inventory_movements. Deterministic: same series in → same plan out.

import { confidenceFromN, type Confidence } from "../detection/anomaly";

/**
 * Inverse standard normal CDF (Acklam's rational approximation). We only need it
 * for service levels around 0.90–0.99; invNormApprox(0.95) ≈ 1.6449.
 */
export function invNormApprox(p: number): number {
  if (p <= 0) return Number.NEGATIVE_INFINITY;
  if (p >= 1) return Number.POSITIVE_INFINITY;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

export interface ReorderInput {
  /** Observed daily demand (units/day), one entry per day in the window. */
  dailyDemand: number[];
  currentUnits: number;
  leadDays: number;
  bufferDays: number;
  /** Target in-stock probability over the cover window. Default 0.95. */
  serviceLevel?: number;
}

export interface ReorderPlan {
  mean_daily_demand: number;
  stddev_daily_demand: number;
  cover_days: number;
  service_level: number;
  safety_stock: number;
  recommended_order: number;
  current_units: number;
  /** Length of the (zero-filled) demand window. */
  window_days: number;
  /** Days with observed (non-zero) demand — the real signal count. */
  observed_days: number;
  /** Alias of observed_days; what confidence is graded on. */
  sample_n: number;
  confidence: Confidence;
}

/** Sample mean and sample (n−1) standard deviation of a numeric series. */
function meanStd(xs: number[]): { mean: number; std: number } {
  const n = xs.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { mean, std: 0 };
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return { mean, std: Math.sqrt(variance) };
}

export function recommendReorder(input: ReorderInput): ReorderPlan {
  const { dailyDemand, currentUnits, leadDays, bufferDays } = input;
  const serviceLevel = input.serviceLevel ?? 0.95;
  const { mean, std } = meanStd(dailyDemand);
  const cover = Math.max(0, leadDays + bufferDays);
  const z = invNormApprox(serviceLevel);
  const safety = Math.max(0, z * std * Math.sqrt(cover));
  const recommended = Math.max(0, mean * cover + safety - currentUnits);

  // Grade confidence by the number of days we actually OBSERVED demand, not the
  // zero-filled window length — a brand-new SKU with 3 sales days is "low", not
  // "high", however wide the window. Generalises across any upload's history.
  const observations = dailyDemand.filter((d) => d > 0).length;

  return {
    mean_daily_demand: mean,
    stddev_daily_demand: std,
    cover_days: cover,
    service_level: serviceLevel,
    safety_stock: safety,
    recommended_order: recommended,
    current_units: currentUnits,
    window_days: dailyDemand.length,
    observed_days: observations,
    sample_n: observations,
    confidence: confidenceFromN(observations),
  };
}
