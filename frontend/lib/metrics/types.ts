/** One month of a product time series (from product_monthly_series RPC). */
export interface MonthlyPoint {
  product_id: string;
  month: string;
  units: number;
  revenue: number;
  refund_amount: number;
  refund_count: number;
  ad_spend: number;
  ad_revenue: number;
}

// Config-driven metrics — shared types.
//
// KPIs are defined as DATA (metric_definitions rows), not in code. A definition
// combines named source fields with a constrained operation; the engine never
// evals arbitrary expressions.

export type Operation = "ratio" | "value";
export type Direction = "above" | "below"; // which side of the threshold is a breach
export type MetricStatus = "healthy" | "warning" | "critical";

export interface MetricDefinition {
  metric_key: string;
  display_name: string;
  description: string | null;
  unit: string;
  numerator_source: string;
  numerator_field: string;
  denominator_source: string | null;
  denominator_field: string | null;
  operation: Operation;
  window_days: number;
  direction: Direction;
  default_threshold: number;
  severity: string;
  enabled: boolean;
  sort_order: number;
  // Which source fact (and label) represents this metric's £/figure exposure,
  // used when breach detection opens an incident. See migration 005.
  impact_source: string | null;
  impact_field: string | null;
  impact_label: string | null;
}

// One row of product_source_facts(window_days) — the generic source layer.
// Columns are `<source>_<field>` so a definition's (source, field) maps directly.
export interface ProductSourceFacts {
  product_id: string;
  sales_revenue: number;
  sales_units: number;
  refunds_amount: number;
  refunds_count: number;
  ads_spend: number;
  ads_revenue: number;
  support_count: number;
}

export interface ThresholdOverride {
  product_id: string | null;
  metric_key: string;
  threshold: number;
  direction: Direction | null;
  active: boolean;
}

export interface MetricValue {
  metric_key: string;
  display_name: string;
  unit: string;
  value: number | null; // null = undefined (e.g. ratio with zero denominator)
  threshold: number;
  direction: Direction;
  status: MetricStatus;
  severity: string;
}
