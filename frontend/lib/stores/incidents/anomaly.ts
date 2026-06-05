// SPC (statistical process control) helpers for the Quant Analyst — pure math,
// no DB, no `server-only`, so they are trivially unit-tested and reusable in
// both detection (severity nudge) and the quant toolkit.
//
// Honesty-first: with thin retail data (≤24 monthly points; baselines only where
// n≥3), confidence is graded from the sample size and z alone is never treated as
// "anomalous" until there is enough history to trust it.

export type Confidence = "high" | "moderate" | "low" | "none";

/** Standard score of `value` against a baseline. Null when σ is unusable. */
export function zScore(value: number, mean: number, stddev: number): number | null {
  if (!Number.isFinite(stddev) || stddev <= 0) return null;
  if (!Number.isFinite(value) || !Number.isFinite(mean)) return null;
  return (value - mean) / stddev;
}

/** Confidence graded purely from sample size n. */
export function confidenceFromN(n: number): Confidence {
  if (n >= 12) return "high";
  if (n >= 6) return "moderate";
  if (n >= 3) return "low";
  return "none";
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
}

/** 95% CI for the mean: mean ± 1.96·σ/√n. Null when n<1 or σ unusable. */
export function confidenceInterval(
  mean: number,
  stddev: number,
  n: number,
): ConfidenceInterval | null {
  if (!Number.isFinite(mean) || !Number.isFinite(stddev) || stddev < 0) return null;
  if (!Number.isFinite(n) || n < 1) return null;
  const half = (1.96 * stddev) / Math.sqrt(n);
  return { lower: mean - half, upper: mean + half };
}

/**
 * Whether a deviation is a real anomaly. Requires |z|≥2 AND n≥6 — the n guard
 * suppresses false alarms on thin data and curbs multiple-testing across KPIs.
 */
export function isAnomalous(z: number | null, n: number): boolean {
  if (z === null || !Number.isFinite(z)) return false;
  return Math.abs(z) >= 2 && n >= 6;
}
