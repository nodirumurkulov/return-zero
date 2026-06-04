import type { SupabaseClient } from "@supabase/supabase-js";
import { computeMetricsDetailed } from "./engine";
import type { MetricStatus, MetricValue } from "./types";

// Single source of truth for the catalog UI — assembled from the config-driven
// metrics engine (computeMetricsDetailed gives both MetricValue[] and the raw
// source facts), so the UI reads the exact same numbers/thresholds as detection.
// Replaces the retired product_metrics_view / product_metrics_monthly_view.

export interface CatalogProduct {
  product_id: string;
  title: string;
  product_type: string | null;
  gender_segment: string | null;
  revenue_gbp: number;
  units: number;
  support_tickets: number;
  return_rate: number | null;
  refund_rate: number | null;
  ad_roas: number | null;
  health: MetricStatus; // worst metric status
  metrics: MetricValue[]; // for the detail KPI grid + threshold editor
}

const RANK: Record<MetricStatus, number> = { healthy: 0, warning: 1, critical: 2 };

function worstStatus(metrics: MetricValue[]): MetricStatus {
  let worst: MetricStatus = "healthy";
  for (const m of metrics) if (RANK[m.status] > RANK[worst]) worst = m.status;
  return worst;
}

function valueOf(metrics: MetricValue[], key: string): number | null {
  return metrics.find((m) => m.metric_key === key)?.value ?? null;
}

export async function getCatalogProducts(supabase: SupabaseClient): Promise<CatalogProduct[]> {
  const [{ metrics, factsByWindow }, { data: productRows }] = await Promise.all([
    computeMetricsDetailed(supabase),
    supabase.from("products").select("product_id, title, product_type, gender_segment"),
  ]);
  // The seeded definitions all use the 30-day window; take that facts map.
  const facts = factsByWindow.get(30) ?? Array.from(factsByWindow.values())[0] ?? new Map();

  const out: CatalogProduct[] = [];
  for (const p of productRows ?? []) {
    const id = p.product_id as string;
    const mv = metrics[id] ?? [];
    const f = facts.get(id);
    out.push({
      product_id: id,
      title: (p.title as string) ?? id,
      product_type: (p.product_type as string) ?? null,
      gender_segment: (p.gender_segment as string) ?? null,
      revenue_gbp: f?.sales_revenue ?? 0,
      units: f?.sales_units ?? 0,
      support_tickets: f?.support_count ?? 0,
      return_rate: valueOf(mv, "return_rate"),
      refund_rate: valueOf(mv, "refund_rate"),
      ad_roas: valueOf(mv, "ad_roas"),
      health: worstStatus(mv),
      metrics: mv,
    });
  }
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export async function getCatalogProduct(
  supabase: SupabaseClient,
  productId: string
): Promise<CatalogProduct | null> {
  const all = await getCatalogProducts(supabase);
  return all.find((p) => p.product_id === productId) ?? null;
}
