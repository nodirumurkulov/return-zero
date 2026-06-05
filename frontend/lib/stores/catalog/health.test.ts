import { describe, expect, it } from "vitest";
import { computeHealthLevel, computeProductHealth } from "./health";
import type { KpiThreshold, ProductMetric } from "./types";

const PRODUCT_UUID = "11111111-1111-4111-8111-111111111111";

describe("computeHealthLevel", () => {
  it.each([
    { value: 15, threshold: 10, direction: "above" as const, expected: "critical" },
    { value: 9.5, threshold: 10, direction: "above" as const, expected: "warning" },
    { value: 5, threshold: 10, direction: "above" as const, expected: "healthy" },
    { value: 2, threshold: 10, direction: "below" as const, expected: "critical" },
    { value: 10.5, threshold: 10, direction: "below" as const, expected: "warning" },
  ])("value $value vs $threshold ($direction) → $expected", ({ value, threshold, direction, expected }) => {
    expect(computeHealthLevel(value, { threshold, direction })).toBe(expected);
  });
});

describe("computeProductHealth", () => {
  const metrics: ProductMetric = {
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

  it("returns worst health across active thresholds", () => {
    expect(computeProductHealth(metrics, thresholds)).toBe("critical");
  });

  it("ignores inactive thresholds", () => {
    const inactive = thresholds.map((t) => ({ ...t, active: false }));
    expect(computeProductHealth(metrics, inactive)).toBe("healthy");
  });
});
