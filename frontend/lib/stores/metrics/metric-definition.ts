import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";
import type { KpiDirection, KpiHealthStatus, KpiSeverity, MetricKey } from "../catalog/types";

export type { KpiDirection, KpiHealthStatus, KpiSeverity, MetricKey };

export type Operation = Database["public"]["Enums"]["metric_operation"];
export type Direction = KpiDirection;
export type MetricStatus = KpiHealthStatus;

export type MetricDefinition = Database["public"]["Tables"]["metric_definitions"]["Row"];

export interface ThresholdOverride {
  product_id: string | null;
  metric_definition_id: string;
  threshold: number;
  direction: KpiDirection | null;
  active: boolean;
}

export interface MetricValue {
  metric_key: MetricKey;
  display_name: string;
  unit: string;
  value: number | null;
  threshold: number;
  direction: KpiDirection;
  status: KpiHealthStatus;
  severity: KpiSeverity;
}

export interface ComputeOpts {
  scope: StoreScope;
  productId?: string;
  windowDays?: number;
  asOf?: string;
}
