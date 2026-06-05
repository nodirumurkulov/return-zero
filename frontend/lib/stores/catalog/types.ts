/** Catalog domain types — built from the metrics engine, not retired SQL views. */

import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const METRIC_KEYS = ["refund_rate", "return_rate", "ad_roas", "support_volume"] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export type KpiDirection = Database["public"]["Enums"]["metric_direction"];
export type KpiSeverity = Database["public"]["Enums"]["metric_severity"];
export type KpiHealthStatus = "healthy" | "warning" | "critical";

export type KpiThreshold = {
  id: string;
  product_id: string;
  metric_definition_id: string;
  metric_key: MetricKey;
  threshold: number;
  direction: KpiDirection | null;
  active: boolean;
  created_at: string;
};

export type HealthLevel = KpiHealthStatus;

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

export type CatalogProduct = ProductMetric & { health: HealthLevel };

export type ProductMonthlyMetric = {
  product_id: string;
  month_start: string;
  revenue_gbp: number;
  order_count: number;
  return_rate: number;
};

export type CatalogInclude = "thresholds" | "series" | "metrics";

export type CatalogListOpts = {
  organizationId: string;
  include?: CatalogInclude[];
};

export type CatalogGetOpts = {
  organizationId: string;
  productId: string;
  include?: CatalogInclude[];
};

export type CatalogHealthOpts = {
  product: ProductMetric;
  thresholds: KpiThreshold[];
};

export type CatalogUpdateOpts = {
  organizationId: string;
  productId: string;
  metricKey: MetricKey;
  threshold: number;
};

export const metricKeySchema = z.enum(METRIC_KEYS);

export const updateThresholdBodySchema = z
  .object({
    metric_key: metricKeySchema,
    threshold: z.number().finite(),
  })
  .strict();

export type UpdateThresholdBody = z.infer<typeof updateThresholdBodySchema>;

export const updateThresholdResponseSchema = z.object({ ok: z.literal(true) }).strict();
