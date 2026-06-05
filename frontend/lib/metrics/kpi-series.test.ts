import { describe, expect, it } from "vitest";
import { baselineStats, kpiRatioSeries } from "./kpi-series";
import type { MonthlyPoint } from "./types";

function pt(p: Partial<MonthlyPoint>): MonthlyPoint {
  return {
    product_id: "p1",
    month: "2025-10",
    units: 0,
    revenue: 0,
    refund_amount: 0,
    refund_count: 0,
    ad_spend: 0,
    ad_revenue: 0,
    ...p,
  };
}

describe("kpiRatioSeries", () => {
  it("computes refund_rate per month and skips zero-revenue months", () => {
    const series = [
      pt({ revenue: 1000, refund_amount: 100 }), // 0.10
      pt({ revenue: 0, refund_amount: 50 }), // skipped (no revenue)
      pt({ revenue: 2000, refund_amount: 400 }), // 0.20
    ];
    expect(kpiRatioSeries(series, "refund_rate")).toEqual([0.1, 0.2]);
  });

  it("computes ad_roas where there is spend", () => {
    const series = [
      pt({ ad_spend: 100, ad_revenue: 300 }), // 3.0
      pt({ ad_spend: 0, ad_revenue: 50 }), // skipped
    ];
    expect(kpiRatioSeries(series, "ad_roas")).toEqual([3]);
  });

  it("returns [] for non-ratio KPIs", () => {
    expect(kpiRatioSeries([pt({ revenue: 100 })], "support_volume")).toEqual([]);
  });
});

describe("baselineStats", () => {
  it("computes mean and population stddev", () => {
    const s = baselineStats([0.1, 0.2, 0.3]);
    expect(s.mean).toBeCloseTo(0.2, 6);
    expect(s.stddev).toBeCloseTo(Math.sqrt(((0.1) ** 2 + 0 + (0.1) ** 2) / 3), 6);
    expect(s.n).toBe(3);
  });

  it("is empty-safe", () => {
    expect(baselineStats([])).toEqual({ mean: 0, stddev: 0, n: 0 });
  });
});
