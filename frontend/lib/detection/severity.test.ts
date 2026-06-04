import { describe, expect, it } from "vitest";
import type { MonthlyPoint } from "../metrics/types";
import {
  breachMagnitude,
  metricTrendWorsening,
  scoreSeverity,
  severityRank,
} from "./severity";

describe("severityRank", () => {
  it("orders severities by impact", () => {
    expect(severityRank("critical")).toBeGreaterThan(severityRank("high"));
    expect(severityRank("high")).toBeGreaterThan(severityRank("medium"));
  });
});

describe("breachMagnitude", () => {
  it("computes above-threshold multiple", () => {
    expect(breachMagnitude(30, 10, "above")).toBe(3);
  });

  it("computes below-threshold multiple", () => {
    expect(breachMagnitude(2, 10, "below")).toBe(5);
  });
});

describe("scoreSeverity", () => {
  it("returns critical for large breach and impact", () => {
    const severity = scoreSeverity({
      baseSeverity: "high",
      magnitude: 3,
      impactAmount: 60_000,
      worsening: true,
    });
    expect(severity).toBe("critical");
  });
});

describe("metricTrendWorsening", () => {
  it("detects worsening refund rate", () => {
    const series: MonthlyPoint[] = Array.from({ length: 6 }, (_, i) => ({
      product_id: "demo-product",
      month: `2024-${String(i + 1).padStart(2, "0")}`,
      revenue: 1000,
      refund_amount: 100 + i * 50,
      refund_count: 10 + i,
      units: 100,
      ad_spend: 200,
      ad_revenue: 400,
    }));

    expect(metricTrendWorsening("refund_rate", series, "above")).toBe(true);
  });
});
