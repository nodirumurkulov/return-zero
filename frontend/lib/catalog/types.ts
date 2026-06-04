import type { Views } from "@/lib/supabase/db";

/** Catalog domain types — aligned with Supabase views / tables. */

export type ProductMetric = Views<"product_metrics_view">;

export type ProductMonthlyMetric = Views<"product_metrics_monthly_view">;

export type KpiThreshold = {
  id: string;
  product_id: string | null;
  metric_key: string;
  threshold: number;
  direction: string | null;
  active: boolean;
  created_at: string;
};

export type HealthLevel = "healthy" | "warning" | "critical";
