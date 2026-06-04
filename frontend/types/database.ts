export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          product_id: string;
          title: string | null;
          handle: string | null;
          product_type: string | null;
          gender_segment: string | null;
          status: string | null;
        };
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          status: string;
          severity: string;
          impact_amount: number | null;
          impact_label: string | null;
          affected_product: string | null;
          affected_kpis: Json | null;
          root_cause: string | null;
          root_cause_confidence: number | null;
          created_at: string;
          resolved_at: string | null;
        };
        Update: {
          status?: string;
          resolved_at?: string | null;
        };
      };
      product_kpi_thresholds: {
        Row: {
          id: string;
          product_id: string;
          kpi_name: string;
          warning_value: number;
          critical_value: number;
          direction: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          kpi_name: string;
          warning_value: number;
          critical_value: number;
          direction?: string;
        };
        Update: {
          warning_value?: number;
          critical_value?: number;
          updated_at?: string;
        };
      };
    };
    Views: {
      product_metrics_view: {
        Row: {
          product_id: string;
          title: string | null;
          product_type: string | null;
          gender_segment: string | null;
          revenue_gbp: number | null;
          order_count: number | null;
          return_rate: number | null;
          refund_rate: number | null;
          support_tickets: number | null;
          ad_roas: number | null;
        };
      };
      product_metrics_monthly_view: {
        Row: {
          product_id: string;
          month_start: string;
          revenue_gbp: number | null;
          order_count: number | null;
          return_rate: number | null;
        };
      };
    };
  };
};

export type ProductMetric = Database["public"]["Views"]["product_metrics_view"]["Row"];
export type ProductMonthlyMetric =
  Database["public"]["Views"]["product_metrics_monthly_view"]["Row"];
export type KpiThreshold = Database["public"]["Tables"]["product_kpi_thresholds"]["Row"];

export type HealthLevel = "healthy" | "warning" | "critical";

export function computeHealthLevel(
  value: number,
  threshold: Pick<KpiThreshold, "warning_value" | "critical_value" | "direction">
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
