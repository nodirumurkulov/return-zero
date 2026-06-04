import type { HealthLevel, KpiThreshold, ProductMetric } from "./types";

export function computeHealthLevel(
  value: number,
  threshold: Pick<KpiThreshold, "warning_value" | "critical_value" | "direction">,
): HealthLevel {
  const { warning_value, critical_value, direction } = threshold;
  if (direction === "below") {
    if (value <= critical_value) return "critical";
    if (value <= warning_value) return "warning";
    return "healthy";
  }
  if (value >= critical_value) return "critical";
  if (value >= warning_value) return "warning";
  return "healthy";
}

function metricValue(metrics: ProductMetric, kpiName: string): number | null {
  switch (kpiName) {
    case "return_rate":
      return metrics.return_rate;
    case "refund_rate":
      return metrics.refund_rate;
    case "support_tickets":
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
    const value = metricValue(metrics, threshold.kpi_name);
    if (value == null) return worst;
    const level = computeHealthLevel(value, threshold);
    return rank[level] > rank[worst] ? level : worst;
  }, "healthy");
}
