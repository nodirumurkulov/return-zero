import type { Direction } from "../metrics/types";
import type { MonthlyPoint } from "../metrics/series";
import { linearTrend } from "../forecast/methods";

export type Severity = "critical" | "high" | "medium" | "low";

const RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function severityRank(s: string): number {
  return RANK[(s as Severity)] ?? 2;
}

/** How far past the threshold a breach is, as a multiple (>=1 means breached). */
export function breachMagnitude(value: number, threshold: number, direction: Direction): number {
  if (threshold === 0) return 1;
  return direction === "above" ? value / threshold : threshold / Math.max(value, 1e-9);
}

/**
 * Deterministic severity (RUN-21): a transparent points model over breach
 * magnitude, £ impact, and trend, nudged by the KPI's configured base severity.
 * No LLM — same inputs always give the same badge.
 */
export function scoreSeverity(input: {
  baseSeverity: string;
  magnitude: number; // >=1, how far past threshold
  impactAmount: number; // £ exposure
  worsening?: boolean; // forecast trend heading further from target
}): Severity {
  let score = (severityRank(input.baseSeverity) - 2) * 0.5; // base nudge: -0.5..+1

  if (input.magnitude >= 3) score += 3;
  else if (input.magnitude >= 2) score += 2;
  else if (input.magnitude >= 1.5) score += 1;

  if (input.impactAmount >= 50_000) score += 3;
  else if (input.impactAmount >= 20_000) score += 2;
  else if (input.impactAmount >= 5_000) score += 1;

  if (input.worsening) score += 1;

  if (score >= 4.5) return "critical";
  if (score >= 2.5) return "high";
  if (score >= 1) return "medium";
  return "low";
}

/** Is the metric's recent series trending further from its healthy side? */
export function metricTrendWorsening(metricKey: string, series: MonthlyPoint[], direction: Direction): boolean {
  if (series.length < 4) return false;
  const recent = series.slice(-6);
  let rates: number[];
  switch (metricKey) {
    case "refund_rate":
      rates = recent.map((p) => (p.revenue > 0 ? p.refund_amount / p.revenue : 0));
      break;
    case "return_rate":
      rates = recent.map((p) => (p.units > 0 ? p.refund_count / p.units : 0));
      break;
    case "ad_roas":
      rates = recent.map((p) => (p.ad_spend > 0 ? p.ad_revenue / p.ad_spend : 0));
      break;
    default:
      return false;
  }
  const slope = linearTrend(rates).slope;
  // "above" breaches worsen as the rate rises; "below" (ROAS) worsens as it falls.
  return direction === "above" ? slope > 0 : slope < 0;
}
