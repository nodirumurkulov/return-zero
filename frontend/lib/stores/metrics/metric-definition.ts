import type { Database } from "@/lib/supabase/database.types";

export type Operation = Database["public"]["Enums"]["metric_operation"];
export type Direction = Database["public"]["Enums"]["metric_direction"];
export type MetricStatus = "healthy" | "warning" | "critical";

export type MetricDefinition = Database["public"]["Tables"]["metric_definitions"]["Row"];

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
