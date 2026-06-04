import type { SupabaseClient } from "@supabase/supabase-js";

import type { KpiThreshold, ProductMetric, ProductMonthlyMetric } from "./types";

export async function listCatalogWithThresholds(supabase: SupabaseClient): Promise<{
  products: ProductMetric[];
  thresholdsByProduct: Record<string, KpiThreshold[]>;
}> {
  const [{ data: products, error: productsError }, { data: thresholds, error: thresholdsError }] =
    await Promise.all([
      supabase.from("product_metrics_view").select("*").order("title"),
      supabase.from("product_kpi_thresholds").select("*"),
    ]);

  if (productsError) throw new Error(productsError.message);
  if (thresholdsError) throw new Error(thresholdsError.message);

  const thresholdsByProduct = (thresholds ?? []).reduce<Record<string, KpiThreshold[]>>(
    (acc, row) => {
      const threshold = row as KpiThreshold;
      const list = acc[threshold.product_id] ?? [];
      list.push(threshold);
      acc[threshold.product_id] = list;
      return acc;
    },
    {},
  );

  return {
    products: (products ?? []) as ProductMetric[],
    thresholdsByProduct,
  };
}

export async function getProductCatalogDetail(
  supabase: SupabaseClient,
  productId: string,
): Promise<{
  product: ProductMetric;
  monthly: ProductMonthlyMetric[];
  thresholds: KpiThreshold[];
} | null> {
  const [{ data: product, error }, { data: monthly }, { data: thresholds }] = await Promise.all([
    supabase.from("product_metrics_view").select("*").eq("product_id", productId).maybeSingle(),
    supabase
      .from("product_metrics_monthly_view")
      .select("*")
      .eq("product_id", productId)
      .order("month_start"),
    supabase.from("product_kpi_thresholds").select("*").eq("product_id", productId),
  ]);

  if (error || !product) return null;

  return {
    product: product as ProductMetric,
    monthly: (monthly ?? []) as ProductMonthlyMetric[],
    thresholds: (thresholds ?? []) as KpiThreshold[],
  };
}
