import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { metricStatusFor, computeMetricsDetailed } from "@/lib/stores/metrics/engine";
import type { MetricValue } from "@/lib/stores/metrics/metric-definition";
import { getProductSeries } from "@/lib/stores/metrics/series";
import type { ProductSourceFacts } from "@/lib/stores/metrics/source-facts";
import type { Database } from "@/lib/supabase/database.types";

import { CatalogError } from "./errors";
import {
  metricKeySchema,
  type CatalogGetOpts,
  type CatalogHealthOpts,
  type CatalogListOpts,
  type CatalogUpdateOpts,
  type CatalogProduct,
  type HealthLevel,
  type KpiThreshold,
  type MetricKey,
  type ProductMetric,
  type ProductMonthlyMetric,
} from "./types";

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "external_id" | "title" | "product_type" | "gender_segment"
>;

export class Catalog {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(opts: CatalogListOpts): Promise<{
    products: CatalogProduct[];
    thresholdsByProduct: Record<string, KpiThreshold[]>;
  }> {
    const include = opts.include ?? ["thresholds"];
    const [{ metrics, facts, productRows }, thresholdsByProduct] = await Promise.all([
      this.#buildCatalog(opts.organizationId),
      include.includes("thresholds")
        ? this.#loadThresholdsByProduct(opts.organizationId)
        : Promise.resolve({} as Record<string, KpiThreshold[]>),
    ]);

    const products: CatalogProduct[] = productRows
      .map((row) => {
        const product = this.#toProductMetric(row, metrics[row.id] ?? [], facts.get(row.id));
        const thresholds = thresholdsByProduct[row.id] ?? [];
        return { ...product, health: this.#productHealth(product, thresholds) };
      })
      .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

    return { products, thresholdsByProduct };
  }

  async get(opts: CatalogGetOpts): Promise<{
    product: CatalogProduct;
    monthly: ProductMonthlyMetric[];
    thresholds: KpiThreshold[];
  } | null> {
    const [{ metrics, factsByWindow }, productRes, series, thresholds] = await Promise.all([
      computeMetricsDetailed(this.supabase, {
        organizationId: opts.organizationId,
        productId: opts.productId,
      }),
      this.supabase
        .from("products")
        .select("id, external_id, title, product_type, gender_segment")
        .eq("organization_id", opts.organizationId)
        .eq("id", opts.productId)
        .maybeSingle(),
      getProductSeries(this.supabase, opts.organizationId, opts.productId, 12),
      this.#loadThresholdsForProduct(opts.organizationId, opts.productId),
    ]);

    const row = productRes.data;
    if (productRes.error || !row) return null;

    const facts =
      factsByWindow.get(30) ??
      Array.from(factsByWindow.values())[0] ??
      new Map<string, ProductSourceFacts>();
    const product = this.#toProductMetric(row, metrics[opts.productId] ?? [], facts.get(opts.productId));

    return {
      product: { ...product, health: this.#productHealth(product, thresholds) },
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

  health(opts: CatalogHealthOpts): HealthLevel {
    return this.#productHealth(opts.product, opts.thresholds);
  }

  async update(opts: CatalogUpdateOpts): Promise<void> {
    const { data: metricDef, error: defErr } = await this.supabase
      .from("metric_definitions")
      .select("id")
      .eq("organization_id", opts.organizationId)
      .eq("metric_key", opts.metricKey)
      .maybeSingle();

    if (defErr ?? !metricDef) {
      throw new CatalogError(defErr?.message ?? "Unknown metric");
    }

    const { error } = await this.supabase.from("product_kpi_thresholds").upsert(
      {
        organization_id: opts.organizationId,
        product_id: opts.productId,
        metric_definition_id: metricDef.id,
        threshold: opts.threshold,
        active: true,
      },
      { onConflict: "organization_id,product_id,metric_definition_id" },
    );

    if (error) throw new CatalogError(error.message);
  }

  async #buildCatalog(organizationId: string): Promise<{
    metrics: Record<string, MetricValue[]>;
    facts: Map<string, ProductSourceFacts>;
    productRows: ProductRow[];
  }> {
    const [{ metrics, factsByWindow }, { data: productRows, error }] = await Promise.all([
      computeMetricsDetailed(this.supabase, { organizationId }),
      this.supabase
        .from("products")
        .select("id, external_id, title, product_type, gender_segment")
        .eq("organization_id", organizationId),
    ]);
    if (error) throw new CatalogError(error.message);
    const facts =
      factsByWindow.get(30) ??
      Array.from(factsByWindow.values())[0] ??
      new Map<string, ProductSourceFacts>();
    return { metrics, facts, productRows: productRows ?? [] };
  }

  #toProductMetric(
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
      return_rate: this.#valueOf(metrics, "return_rate"),
      refund_rate: this.#valueOf(metrics, "refund_rate"),
      support_tickets: Math.round(facts?.support_count ?? 0),
      ad_roas: this.#valueOf(metrics, "ad_roas"),
    };
  }

  #valueOf(metrics: MetricValue[], key: MetricKey): number | null {
    return metrics.find((m) => m.metric_key === key)?.value ?? null;
  }

  #metricKeyFromJoin(
    joined: { metric_key: string } | { metric_key: string }[] | null,
  ): MetricKey {
    if (!joined) throw new CatalogError("missing metric_definitions join");
    const raw = Array.isArray(joined) ? joined[0]?.metric_key : joined.metric_key;
    if (!raw) throw new CatalogError("missing metric_key on metric_definitions join");
    return metricKeySchema.parse(raw);
  }

  async #loadThresholdsForProduct(
    organizationId: string,
    productId: string,
  ): Promise<KpiThreshold[]> {
    const { data, error } = await this.supabase
      .from("product_kpi_thresholds")
      .select(
        "id, product_id, metric_definition_id, threshold, direction, active, created_at, metric_definitions!inner(metric_key)",
      )
      .eq("organization_id", organizationId)
      .eq("product_id", productId)
      .eq("active", true);

    if (error) throw new CatalogError(`load product_kpi_thresholds: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      product_id: row.product_id,
      metric_definition_id: row.metric_definition_id,
      metric_key: this.#metricKeyFromJoin(row.metric_definitions),
      threshold: row.threshold,
      direction: row.direction,
      active: row.active,
      created_at: row.created_at,
    }));
  }

  async #loadThresholdsByProduct(
    organizationId: string,
  ): Promise<Record<string, KpiThreshold[]>> {
    const { data, error } = await this.supabase
      .from("product_kpi_thresholds")
      .select(
        "id, product_id, metric_definition_id, threshold, direction, active, created_at, metric_definitions!inner(metric_key)",
      )
      .eq("organization_id", organizationId)
      .eq("active", true);

    if (error) throw new CatalogError(`load product_kpi_thresholds: ${error.message}`);

    return (data ?? []).reduce<Record<string, KpiThreshold[]>>((acc, row) => {
      const threshold: KpiThreshold = {
        id: row.id,
        product_id: row.product_id,
        metric_definition_id: row.metric_definition_id,
        metric_key: this.#metricKeyFromJoin(row.metric_definitions),
        threshold: row.threshold,
        direction: row.direction,
        active: row.active,
        created_at: row.created_at,
      };
      (acc[row.product_id] ??= []).push(threshold);
      return acc;
    }, {});
  }

  #productHealth(metrics: ProductMetric, thresholds: KpiThreshold[]): HealthLevel {
    const rank = { healthy: 0, warning: 1, critical: 2 } as const;

    return thresholds.reduce<HealthLevel>((worst, threshold) => {
      if (!threshold.active) return worst;
      const value = this.#metricValue(metrics, threshold.metric_key);
      if (value == null) return worst;
      const direction = threshold.direction === "below" ? "below" : "above";
      const level = metricStatusFor(value, threshold.threshold, direction);
      return rank[level] > rank[worst] ? level : worst;
    }, "healthy");
  }

  #metricValue(metrics: ProductMetric, key: MetricKey): number | null {
    switch (key) {
      case "return_rate":
        return metrics.return_rate;
      case "refund_rate":
        return metrics.refund_rate;
      case "support_volume":
        return metrics.support_tickets;
      case "ad_roas":
        return metrics.ad_roas;
    }
  }
}
