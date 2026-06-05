import type { HealthLevel, KpiThreshold, ProductMetric } from "./types";

// ProductMetric.product_id is the internal products.id uuid; thresholds reference the same id.

const WARNING_BAND = 0.1;

function effectiveDirection(threshold: KpiThreshold): "above" | "below" {
  return threshold.direction === "below" ? "below" : "above";
}

export function computeHealthLevel(
  value: number,
  threshold: Pick<KpiThreshold, "threshold" | "direction">,
): HealthLevel {
  const direction = effectiveDirection(threshold as KpiThreshold);
  const t = threshold.threshold;

  if (direction === "below") {
    if (value <= t) return "critical";
    if (value <= t * (1 + WARNING_BAND)) return "warning";
    return "healthy";
  }
  if (value >= t) return "critical";
  if (value >= t * (1 - WARNING_BAND)) return "warning";
  return "healthy";
}

function metricValue(metrics: ProductMetric, metricKey: string): number | null {
  switch (metricKey) {
    case "return_rate":
      return metrics.return_rate;
    case "refund_rate":
      return metrics.refund_rate;
    case "support_volume":
      return metrics.support_tickets;
    case "ad_roas":
      return metrics.ad_roas;
    default:
      return null;
  }
}

export function computeProductHealth(
  metrics: ProductMetric,
  thresholds: KpiThreshold[],
): HealthLevel {
  const rank = { healthy: 0, warning: 1, critical: 2 } as const;

  return thresholds.reduce<HealthLevel>((worst, threshold) => {
    if (!threshold.active) return worst;
    const value = metricValue(metrics, threshold.metric_key);
    if (value == null) return worst;
    const level = computeHealthLevel(value, threshold);
    return rank[level] > rank[worst] ? level : worst;
  }, "healthy");
}
