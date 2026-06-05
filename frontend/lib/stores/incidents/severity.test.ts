import { describe, expect, it } from "vitest";
import type { MonthlyPoint } from "@/lib/stores/metrics/monthly-point";
import {
  breachMagnitude,
  metricTrendWorsening,
  scoreSeverity,
  severityRank,
  zSeverityBoost,
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

  it("is unchanged when there is no baseline (zBoost 0)", () => {
    const base = { baseSeverity: "medium", magnitude: 1.6, impactAmount: 6_000 };
    expect(scoreSeverity(base)).toBe(scoreSeverity({ ...base, zBoost: 0 }));
  });

  it("an extreme, trustworthy z can lift severity a band", () => {
    const base = { baseSeverity: "medium", magnitude: 1.6, impactAmount: 6_000 };
    const without = scoreSeverity(base); // 1+1 = 2 → medium
    const withBoost = scoreSeverity({ ...base, zBoost: zSeverityBoost(3.2, "high") }); // +1 → high
    expect(without).toBe("medium");
    expect(withBoost).toBe("high");
  });
});

describe("zSeverityBoost", () => {
  it("adds 1 for |z|≥3 with moderate+ confidence", () => {
    expect(zSeverityBoost(3.1, "high")).toBe(1);
    expect(zSeverityBoost(-3.5, "moderate")).toBe(1);
  });

  it("adds 0.5 for |z|≥2", () => {
    expect(zSeverityBoost(2.2, "low")).toBe(0.5);
    expect(zSeverityBoost(3.1, "low")).toBe(0.5); // not trustworthy enough for full point
  });

  it("adds nothing for small or absent z", () => {
    expect(zSeverityBoost(1.5, "high")).toBe(0);
    expect(zSeverityBoost(null, "high")).toBe(0);
    expect(zSeverityBoost(undefined, "none")).toBe(0);
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
