import type { SupabaseClient } from "@supabase/supabase-js";

import { computeMetricsDetailed } from "@/lib/stores/metrics/engine";
import type { MetricValue } from "@/lib/stores/metrics/metric-definition";
import { getProductSeries } from "@/lib/stores/metrics/series";
import type { ProductSourceFacts } from "@/lib/stores/metrics/source-facts";
import type { Database } from "@/lib/supabase/database.types";

import type { KpiThreshold, ProductMetric, ProductMonthlyMetric } from "./types";

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "external_id" | "title" | "product_type" | "gender_segment"
>;

function valueOf(metrics: MetricValue[], key: string): number | null {
  return metrics.find((m) => m.metric_key === key)?.value ?? null;
}

function toProductMetric(
  row: ProductRow,
  metrics: MetricValue[],
  facts: ProductSourceFacts | undefined,
): ProductMetric {
  return {
    product_id: row.id,
    external_id: row.external_id,
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

function metricKeyFromJoin(
  joined: { metric_key: string } | { metric_key: string }[] | null,
): string {
  if (!joined) return "";
  if (Array.isArray(joined)) return joined[0]?.metric_key ?? "";
  return joined.metric_key;
}

async function loadThresholdsForProduct(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
): Promise<KpiThreshold[]> {
  const { data, error } = await supabase
    .from("product_kpi_thresholds")
    .select(
      "id, product_id, metric_definition_id, threshold, direction, active, created_at, metric_definitions!inner(metric_key)",
    )
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .eq("active", true);

  if (error) throw new Error(`load product_kpi_thresholds: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    metric_definition_id: row.metric_definition_id,
    metric_key: metricKeyFromJoin(row.metric_definitions),
    threshold: row.threshold,
    direction: row.direction,
    active: row.active,
    created_at: row.created_at,
  }));
}

async function loadThresholdsByProduct(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<Record<string, KpiThreshold[]>> {
  const { data, error } = await supabase
    .from("product_kpi_thresholds")
    .select(
      "id, product_id, metric_definition_id, threshold, direction, active, created_at, metric_definitions!inner(metric_key)",
    )
    .eq("organization_id", organizationId)
    .eq("active", true);

  if (error) throw new Error(`load product_kpi_thresholds: ${error.message}`);

  return (data ?? []).reduce<Record<string, KpiThreshold[]>>((acc, row) => {
    const threshold: KpiThreshold = {
      id: row.id,
      product_id: row.product_id,
      metric_definition_id: row.metric_definition_id,
      metric_key: metricKeyFromJoin(row.metric_definitions),
      threshold: row.threshold,
      direction: row.direction,
      active: row.active,
      created_at: row.created_at,
    };
    (acc[row.product_id] ??= []).push(threshold);
    return acc;
  }, {});
}

async function buildCatalog(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  metrics: Record<string, MetricValue[]>;
  facts: Map<string, ProductSourceFacts>;
  productRows: ProductRow[];
}> {
  const [{ metrics, factsByWindow }, { data: productRows, error }] = await Promise.all([
    computeMetricsDetailed(supabase, { organizationId }),
    supabase
      .from("products")
      .select("id, external_id, title, product_type, gender_segment")
      .eq("organization_id", organizationId),
  ]);
  if (error) throw new Error(error.message);
  const facts =
    factsByWindow.get(30) ??
    Array.from(factsByWindow.values())[0] ??
    new Map<string, ProductSourceFacts>();
  return { metrics, facts, productRows: productRows ?? [] };
}

export async function listCatalogWithThresholds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  products: ProductMetric[];
  thresholdsByProduct: Record<string, KpiThreshold[]>;
}> {
  const [{ metrics, facts, productRows }, thresholdsByProduct] = await Promise.all([
    buildCatalog(supabase, organizationId),
    loadThresholdsByProduct(supabase, organizationId),
  ]);

  const products: ProductMetric[] = productRows.map((row) =>
    toProductMetric(row, metrics[row.id] ?? [], facts.get(row.id)),
  );
  products.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  return { products, thresholdsByProduct };
}

export async function getProductCatalogDetail(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
): Promise<{
  product: ProductMetric;
  monthly: ProductMonthlyMetric[];
  thresholds: KpiThreshold[];
} | null> {
  const [{ metrics, factsByWindow }, productRes, series, thresholds] = await Promise.all([
    computeMetricsDetailed(supabase, { organizationId, productId }),
    supabase
      .from("products")
      .select("id, external_id, title, product_type, gender_segment")
      .eq("organization_id", organizationId)
      .eq("id", productId)
      .maybeSingle(),
    getProductSeries(supabase, organizationId, productId, 12),
    loadThresholdsForProduct(supabase, organizationId, productId),
  ]);

  const row = productRes.data;
  if (productRes.error || !row) return null;

  const facts =
    factsByWindow.get(30) ??
    Array.from(factsByWindow.values())[0] ??
    new Map<string, ProductSourceFacts>();
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
    thresholds,
  };
}
