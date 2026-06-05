export type Operation = "ratio" | "value";
export type Direction = "above" | "below";
export type MetricStatus = "healthy" | "warning" | "critical";

export interface MetricDefinition {
  id: string;
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
  impact_source: string | null;
  impact_field: string | null;
  impact_label: string | null;
}

export interface ThresholdOverride {
  product_id: string | null;
  metric_definition_id: string;
  threshold: number;
  direction: Direction | null;
  active: boolean;
}

export interface MetricValue {
  metric_key: string;
  display_name: string;
  unit: string;
  value: number | null;
  threshold: number;
  direction: Direction;
  status: MetricStatus;
  severity: string;
}

export interface ComputeOpts {
  organizationId: string;
  productId?: string;
  windowDays?: number;
  asOf?: string;
}
