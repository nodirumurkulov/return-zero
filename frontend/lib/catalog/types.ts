/** Catalog domain types — built from the metrics engine, not retired SQL views. */

export type ProductMetric = {
  /** Internal product uuid (products.id). */
  product_id: string;
  external_id: string;
  title: string | null;
  product_type: string | null;
  gender_segment: string | null;
  revenue_gbp: number;
  order_count: number;
  return_rate: number | null;
  refund_rate: number | null;
  support_tickets: number;
  ad_roas: number | null;
};

export type ProductMonthlyMetric = {
  product_id: string;
  month_start: string;
  revenue_gbp: number;
  order_count: number;
  return_rate: number;
};

export type KpiThreshold = {
  id: string;
  product_id: string | null;
  metric_definition_id: string;
  metric_key: string;
  threshold: number;
  direction: string | null;
  active: boolean;
  created_at: string;
};

export type HealthLevel = "healthy" | "warning" | "critical";
