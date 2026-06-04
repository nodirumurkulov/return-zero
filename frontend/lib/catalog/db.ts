/** Supabase row shapes owned by the catalog domain. */

export type ProductMetricsRow = {
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

export type ProductMonthlyMetricRow = {
  product_id: string;
  month_start: string;
  revenue_gbp: number | null;
  order_count: number | null;
  return_rate: number | null;
};

export type KpiThresholdRow = {
  id: string;
  product_id: string;
  kpi_name: string;
  warning_value: number;
  critical_value: number;
  direction: string;
  updated_at: string;
};
