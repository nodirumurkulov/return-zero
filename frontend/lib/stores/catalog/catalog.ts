import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { marginBridge, type MarginBridgeInput } from "./forecast/margin";
import {
  forecastForProduct,
  loadProductForecastInputs,
  type ProductForecast,
} from "./forecast/product";
import { recommendReorder, type ReorderPlan } from "./forecast/reorder";
import { computeHealthLevel, computeProductHealth } from "./health";
import { getProductCatalogDetail, listCatalogWithThresholds } from "./queries";
import type {
  CatalogForecastOpts,
  CatalogGetOpts,
  CatalogHealthOpts,
  CatalogListOpts,
  CatalogUpdateOpts,
  HealthLevel,
  KpiThreshold,
  ProductMetric,
  ProductMonthlyMetric,
} from "./types";

export class Catalog {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(opts: CatalogListOpts): Promise<{
    products: ProductMetric[];
    thresholdsByProduct: Record<string, KpiThreshold[]>;
  }> {
    const include = opts.include ?? ["thresholds"];
    const result = await listCatalogWithThresholds(this.supabase, opts.organizationId);
    if (!include.includes("thresholds")) {
      return { products: result.products, thresholdsByProduct: {} };
    }
    return result;
  }

  async get(opts: CatalogGetOpts): Promise<{
    product: ProductMetric;
    monthly: ProductMonthlyMetric[];
    thresholds: KpiThreshold[];
  } | null> {
    return getProductCatalogDetail(this.supabase, opts.organizationId, opts.productId);
  }

  health(opts: CatalogHealthOpts): HealthLevel {
    return computeProductHealth(opts.product, opts.thresholds);
  }

  healthLevel(
    value: number,
    threshold: Pick<KpiThreshold, "threshold" | "direction">,
  ): HealthLevel {
    return computeHealthLevel(value, threshold);
  }

  async forecast(opts: CatalogForecastOpts): Promise<ProductForecast> {
    const inputs = await loadProductForecastInputs(
      this.supabase,
      opts.organizationId,
      opts.productId,
    );
    return forecastForProduct(
      inputs.series,
      inputs.currentUnits,
      inputs.dailyOutflow,
      inputs.leadDays,
      inputs.bufferDays,
    );
  }

  margin(input: MarginBridgeInput) {
    return marginBridge(input);
  }

  reorder(opts: {
    dailyDemand: number[];
    currentUnits: number;
    leadDays: number;
    bufferDays: number;
    serviceLevel?: number;
  }): ReorderPlan {
    return recommendReorder(opts);
  }

  async update(opts: CatalogUpdateOpts): Promise<void> {
    const { data: metricDef, error: defErr } = await this.supabase
      .from("metric_definitions")
      .select("id")
      .eq("organization_id", opts.organizationId)
      .eq("metric_key", opts.metricKey)
      .maybeSingle();

    if (defErr ?? !metricDef) {
      throw new Error(defErr?.message ?? "Unknown metric");
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

    if (error) throw new Error(error.message);
  }
}
