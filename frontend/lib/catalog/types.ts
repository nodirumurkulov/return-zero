/** Catalog domain types — identical to Supabase table/view columns. */

export type ProductMetric = {
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

export type ProductMonthlyMetric = {
  product_id: string;
  month_start: string;
  revenue_gbp: number | null;
  order_count: number | null;
  return_rate: number | null;
};

export type KpiThreshold = {
  id: string;
  product_id: string;
  kpi_name: string;
  warning_value: number;
  critical_value: number;
  direction: string;
  updated_at: string;
};

export type HealthLevel = "healthy" | "warning" | "critical";
