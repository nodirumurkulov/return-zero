import type { KpiThreshold, ProductMetric } from "@/lib/stores";

export function createProductMetricFixture(
  overrides?: Partial<ProductMetric>,
): ProductMetric {
  return {
    product_id: "00000000-0000-4000-8000-000000000001",
    external_id: "classic-tee",
    title: "Classic Tee",
    product_type: "apparel",
    gender_segment: "unisex",
    revenue_gbp: 42000,
    order_count: 1200,
    return_rate: 0.042,
    refund_rate: 0.018,
    support_tickets: 12,
    ad_roas: 2.4,
    ...overrides,
  };
}

export function createKpiThresholdFixture(
  overrides?: Partial<KpiThreshold>,
): KpiThreshold {
  return {
    id: "00000000-0000-4000-8000-000000000002",
    product_id: "00000000-0000-4000-8000-000000000001",
    metric_definition_id: "00000000-0000-4000-8000-000000000003",
    metric_key: "return_rate",
    threshold: 0.05,
    direction: "above",
    active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
