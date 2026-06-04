import CatalogGrid from "@/components/catalog/CatalogGrid";
import { EmptyState } from "@/components/ui/empty-state";
import type { KpiThreshold, ProductMetric } from "@/lib/catalog";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = createServiceClient();

  const [{ data: products, error: productsError }, { data: thresholds, error: thresholdsError }] =
    await Promise.all([
      supabase.from("product_metrics_view").select("*").order("title"),
      supabase.from("product_kpi_thresholds").select("*"),
    ]);

  if (productsError) {
    return (
      <div className="p-6">
        <EmptyState
          title="Could not load catalog"
          description={productsError.message}
        />
      </div>
    );
  }

  if (thresholdsError) {
    return (
      <div className="p-6">
        <EmptyState
          title="Could not load KPI thresholds"
          description={thresholdsError.message}
        />
      </div>
    );
  }

  const thresholdsByProduct = (thresholds ?? []).reduce<Record<string, KpiThreshold[]>>(
    (acc, row) => {
      const list = acc[row.product_id] ?? [];
      list.push(row as KpiThreshold);
      acc[row.product_id] = list;
      return acc;
    },
    {}
  );

  return (
    <CatalogGrid
      products={(products ?? []) as ProductMetric[]}
      thresholdsByProduct={thresholdsByProduct}
    />
  );
}
