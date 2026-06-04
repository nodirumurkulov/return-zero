// Deterministic, transparent time-series methods. No ML, no randomness — same
// input always yields the same forecast (the product's "never flaky" requirement).

import type { PointForecast } from "./types";

export interface TrendFit {
  slope: number;
  intercept: number;
}

/** Ordinary least-squares fit over index 0..n-1. */
export function linearTrend(values: number[]): TrendFit {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const { num, den } = values.reduce(
    (acc, y, i) => ({
      num: acc.num + (i - meanX) * (y - meanY),
      den: acc.den + (i - meanX) ** 2,
    }),
    { num: 0, den: 0 },
  );
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

/** Residual standard deviation around the trend line (for confidence bands). */
export function residualStd(values: number[], fit: TrendFit): number {
  const n = values.length;
  if (n < 3) return 0;
  const ss = values.reduce((sum, y, i) => {
    const pred = fit.intercept + fit.slope * i;
    return sum + (y - pred) ** 2;
  }, 0);
  return Math.sqrt(ss / (n - 2));
}

/** Exponentially-weighted moving average (last smoothed value). */
export function ewma(values: number[], alpha = 0.4): number {
  if (values.length === 0) return 0;
  return values.slice(1).reduce((s, v) => alpha * v + (1 - alpha) * s, values[0]);
}

/**
 * Multiplicative seasonal factor for a future index, given a period (e.g. 12
 * months). Returns 1 (no adjustment) until there are >=2 full cycles of history.
 */
export function seasonalFactor(values: number[], period: number, futureIndex: number): number {
  if (period <= 1 || values.length < period * 2) return 1;
  const overall = values.reduce((a, b) => a + b, 0) / values.length;
  if (overall === 0) return 1;
  const season = ((futureIndex % period) + period) % period;
  const sameSeason = values.filter((_, i) => i % period === season);
  if (sameSeason.length === 0) return 1;
  const avg = sameSeason.reduce((a, b) => a + b, 0) / sameSeason.length;
  return avg / overall;
}

/**
 * Forecast `horizon` steps ahead: linear trend, optional multiplicative
 * seasonality, ~95% band from residual spread. Clamped at 0 (units/£ can't go
 * negative). Blends in EWMA of recent points to stay robust to a noisy tail.
 */
export function forecastAhead(
  values: number[],
  horizon: number,
  opts: { period?: number; seasonal?: boolean } = {},
): PointForecast {
  if (values.length === 0) {
    return { point: 0, lower: 0, upper: 0, horizon, slope: 0, method: "empty", rising: false };
  }
  const fit = linearTrend(values);
  const futureIdx = values.length - 1 + horizon;
  const trendPoint = fit.intercept + fit.slope * futureIdx;

  const level = ewma(values.slice(-Math.min(6, values.length)));
  const blended = 0.6 * trendPoint + 0.4 * (level + fit.slope * horizon);

  const seasonal = opts.seasonal && opts.period;
  const point = Math.max(
    0,
    seasonal ? blended * seasonalFactor(values, opts.period!, futureIdx) : blended,
  );
  const method = seasonal ? "trend+seasonal" : "linear+ewma";

  const band = 1.96 * residualStd(values, fit) * Math.sqrt(horizon);
  return {
    point,
    lower: Math.max(0, point - band),
    upper: point + band,
    horizon,
    slope: fit.slope,
    method,
    rising: fit.slope > 0,
  };
}
