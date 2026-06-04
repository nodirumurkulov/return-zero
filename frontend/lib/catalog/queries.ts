import type { SupabaseClient } from "@supabase/supabase-js";

import { computeMetricsDetailed } from "@/lib/metrics/engine";
import { getProductSeries } from "@/lib/metrics/series";
import type { MetricValue, ProductSourceFacts } from "@/lib/metrics/types";
import type { Database } from "@/lib/supabase/database.types";

import type { KpiThreshold, ProductMetric, ProductMonthlyMetric } from "./types";

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "product_id" | "title" | "product_type" | "gender_segment"
>;

// Catalog data is assembled from the config-driven metrics engine (the single
// source of truth used by detection/forecasting/recovery), not the retired
// product_metrics_view. The KpiThreshold rows are synthesised from each metric's
// effective threshold so the existing warning/critical health UI keeps working.

const WARNING_BAND = 0.1;

function kpiNameFor(metricKey: string): string {
  return metricKey === "support_volume" ? "support_tickets" : metricKey;
}

function valueOf(metrics: MetricValue[], key: string): number | null {
  return metrics.find((m) => m.metric_key === key)?.value ?? null;
}

function synthThresholds(productId: string, metrics: MetricValue[]): KpiThreshold[] {
  return metrics.map((m) => ({
    id: `${productId}:${m.metric_key}`,
    product_id: productId,
    kpi_name: kpiNameFor(m.metric_key),
    critical_value: m.threshold,
    warning_value:
      m.direction === "above" ? m.threshold * (1 - WARNING_BAND) : m.threshold * (1 + WARNING_BAND),
    direction: m.direction,
    updated_at: "",
  }));
}

function toProductMetric(
  row: ProductRow,
  metrics: MetricValue[],
  facts: ProductSourceFacts | undefined
): ProductMetric {
  return {
    product_id: row.product_id,
    title: row.title,
    product_type: row.product_type,
    gender_segment: row.gender_segment,
    revenue_gbp: facts?.sales_revenue ?? 0,
    order_count: Math.round(facts?.sales_units ?? 0),
    return_rate: valueOf(metrics, "return_rate"),
    refund_rate: valueOf(metrics, "refund_rate"),
    support_tickets: Math.round(facts?.support_count ?? 0),
    ad_roas: valueOf(metrics, "ad_roas"),
  };
}

async function buildCatalog(supabase: SupabaseClient<Database>): Promise<{
  metrics: Record<string, MetricValue[]>;
  facts: Map<string, ProductSourceFacts>;
  productRows: ProductRow[];
}> {
  const [{ metrics, factsByWindow }, { data: productRows, error }] = await Promise.all([
    computeMetricsDetailed(supabase),
    supabase.from("products").select("product_id, title, product_type, gender_segment"),
  ]);
  if (error) throw new Error(error.message);
  const facts =
    factsByWindow.get(30) ??
    Array.from(factsByWindow.values())[0] ??
    new Map<string, ProductSourceFacts>();
  return { metrics, facts, productRows: productRows ?? [] };
}

export async function listCatalogWithThresholds(supabase: SupabaseClient<Database>): Promise<{
  products: ProductMetric[];
  thresholdsByProduct: Record<string, KpiThreshold[]>;
}> {
  const { metrics, facts, productRows } = await buildCatalog(supabase);

  const products: ProductMetric[] = [];
  const thresholdsByProduct: Record<string, KpiThreshold[]> = {};
  for (const row of productRows) {
    const id = row.product_id;
    const mv = metrics[id] ?? [];
    products.push(toProductMetric(row, mv, facts.get(id)));
    thresholdsByProduct[id] = synthThresholds(id, mv);
  }
  products.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  return { products, thresholdsByProduct };
}

export async function getProductCatalogDetail(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<{
  product: ProductMetric;
  monthly: ProductMonthlyMetric[];
  thresholds: KpiThreshold[];
} | null> {
  const [{ metrics, facts, productRows }, series] = await Promise.all([
    buildCatalog(supabase),
    getProductSeries(supabase, productId, 12),
  ]);

  const row = productRows.find((p) => p.product_id === productId);
  if (!row) return null;

  const mv = metrics[productId] ?? [];
  return {
    product: toProductMetric(row, mv, facts.get(productId)),
    monthly: series.map((p) => ({
      product_id: p.product_id,
      month_start: p.month,
      revenue_gbp: p.revenue,
      order_count: Math.round(p.units),
      return_rate: p.units > 0 ? p.refund_count / p.units : 0,
    })),
    thresholds: synthThresholds(productId, mv),
  };
}
