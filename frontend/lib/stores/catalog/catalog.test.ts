import { describe, expect, it } from "vitest";

import { Catalog } from "./catalog";
import type { KpiThreshold, ProductMetric } from "./types";

const PRODUCT_UUID = "11111111-1111-4111-8111-111111111111";

const baseProduct: ProductMetric = {
  product_id: PRODUCT_UUID,
  external_id: "court-trainer",
  title: "Court Trainer",
  product_type: "shoes",
  gender_segment: "unisex",
  revenue_gbp: 1000,
  order_count: 50,
  return_rate: 12,
  refund_rate: 5,
  support_tickets: 20,
  ad_roas: 2.5,
};

describe("Catalog.health", () => {
  const catalog = new Catalog(null!);

  it.each([
    { metricKey: "return_rate" as const, value: 15, threshold: 10, direction: "above" as const, expected: "critical" },
    { metricKey: "return_rate" as const, value: 9.5, threshold: 10, direction: "above" as const, expected: "warning" },
    { metricKey: "return_rate" as const, value: 5, threshold: 10, direction: "above" as const, expected: "healthy" },
    { metricKey: "ad_roas" as const, value: 2, threshold: 10, direction: "below" as const, expected: "critical" },
    { metricKey: "ad_roas" as const, value: 10.5, threshold: 10, direction: "below" as const, expected: "warning" },
  ])(
    "$metricKey $value vs $threshold ($direction) → $expected",
    ({ metricKey, value, threshold, direction, expected }) => {
      const product = { ...baseProduct, [metricKey === "ad_roas" ? "ad_roas" : "return_rate"]: value };
      const thresholds: KpiThreshold[] = [
        {
          id: "t1",
          product_id: PRODUCT_UUID,
          metric_definition_id: "22222222-2222-4222-8222-222222222221",
          metric_key: metricKey,
          threshold,
          direction,
          active: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      ];
      expect(catalog.health({ product, thresholds })).toBe(expected);
    },
  );

  it("returns worst health across active thresholds", () => {
    const thresholds: KpiThreshold[] = [
      {
        id: "t1",
        product_id: PRODUCT_UUID,
        metric_definition_id: "22222222-2222-4222-8222-222222222221",
        metric_key: "return_rate",
        threshold: 10,
        direction: "above",
        active: true,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "t2",
        product_id: PRODUCT_UUID,
        metric_definition_id: "22222222-2222-4222-8222-222222222222",
        metric_key: "ad_roas",
        threshold: 3,
        direction: "below",
        active: true,
        created_at: "2024-01-01T00:00:00Z",
      },
    ];
    expect(catalog.health({ product: baseProduct, thresholds })).toBe("critical");
  });

  it("ignores inactive thresholds", () => {
    const thresholds: KpiThreshold[] = [
      {
        id: "t1",
        product_id: PRODUCT_UUID,
        metric_definition_id: "22222222-2222-4222-8222-222222222221",
        metric_key: "return_rate",
        threshold: 10,
        direction: "above",
        active: false,
        created_at: "2024-01-01T00:00:00Z",
      },
    ];
    expect(catalog.health({ product: baseProduct, thresholds })).toBe("healthy");
  });
});
