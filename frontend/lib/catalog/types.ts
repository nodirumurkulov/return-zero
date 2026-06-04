import type { KpiThresholdRow, ProductMetricsRow, ProductMonthlyMetricRow } from "./db";

export type ProductMetric = ProductMetricsRow;
export type ProductMonthlyMetric = ProductMonthlyMetricRow;
export type KpiThreshold = KpiThresholdRow;
export type HealthLevel = "healthy" | "warning" | "critical";
