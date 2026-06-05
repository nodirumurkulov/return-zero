import { linearTrend } from "@/lib/stores/analytics/forecast/methods";
import type { Direction } from "@/lib/stores/analytics/metrics/metric-definition";
import type { MonthlyPoint } from "@/lib/stores/analytics/metrics/monthly-point";

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
  const magnitudePoints =
    input.magnitude >= 3 ? 3 : input.magnitude >= 2 ? 2 : input.magnitude >= 1.5 ? 1 : 0;
  const impactPoints =
    input.impactAmount >= 50_000
      ? 3
      : input.impactAmount >= 20_000
        ? 2
        : input.impactAmount >= 5_000
          ? 1
          : 0;
  const score =
    (severityRank(input.baseSeverity) - 2) * 0.5 +
    magnitudePoints +
    impactPoints +
    (input.worsening ? 1 : 0);

  if (score >= 4.5) return "critical";
  if (score >= 2.5) return "high";
  if (score >= 1) return "medium";
  return "low";
}

function recentRates(metricKey: string, recent: MonthlyPoint[]): number[] | null {
  switch (metricKey) {
    case "refund_rate":
      return recent.map((p) => (p.revenue > 0 ? p.refund_amount / p.revenue : 0));
    case "return_rate":
      return recent.map((p) => (p.units > 0 ? p.refund_count / p.units : 0));
    case "ad_roas":
      return recent.map((p) => (p.ad_spend > 0 ? p.ad_revenue / p.ad_spend : 0));
    default:
      return null;
  }
}

/** Is the metric's recent series trending further from its healthy side? */
export function metricTrendWorsening(metricKey: string, series: MonthlyPoint[], direction: Direction): boolean {
  if (series.length < 4) return false;
  const recent = series.slice(-6);
  const rates = recentRates(metricKey, recent);
  if (!rates) return false;
  const slope = linearTrend(rates).slope;
  return direction === "above" ? slope > 0 : slope < 0;
}
