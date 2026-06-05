import { describe, expect, it } from "vitest";
import { invNormApprox, recommendReorder } from "./reorder";

describe("invNormApprox", () => {
  it("approximates the 95% quantile at ~1.645", () => {
    expect(invNormApprox(0.95)).toBeCloseTo(1.6449, 3);
  });

  it("is ~0 at the median and symmetric", () => {
    expect(invNormApprox(0.5)).toBeCloseTo(0, 6);
    expect(invNormApprox(0.975)).toBeCloseTo(1.95996, 3);
    expect(invNormApprox(0.025)).toBeCloseTo(-1.95996, 3);
  });
});

describe("recommendReorder", () => {
  it("computes sample mean and (n-1) stddev", () => {
    const plan = recommendReorder({
      dailyDemand: [2, 4, 6],
      currentUnits: 0,
      leadDays: 10,
      bufferDays: 0,
    });
    expect(plan.mean_daily_demand).toBeCloseTo(4, 6);
    expect(plan.stddev_daily_demand).toBeCloseTo(2, 6); // sqrt(((2)^2+0+(2)^2)/2)=2
  });

  it("sizes safety stock as z·σ·√cover", () => {
    const plan = recommendReorder({
      dailyDemand: [2, 4, 6],
      currentUnits: 0,
      leadDays: 9,
      bufferDays: 0,
      serviceLevel: 0.95,
    });
    // z≈1.645, σ=2, cover=9 → safety ≈ 1.645*2*3 = 9.87
    expect(plan.safety_stock).toBeCloseTo(1.6449 * 2 * 3, 2);
  });

  it("recommends mean·cover + safety − current, clamped at 0", () => {
    const plan = recommendReorder({
      dailyDemand: [4, 4, 4], // σ=0 → no safety
      currentUnits: 100,
      leadDays: 10,
      bufferDays: 0,
    });
    // demand cover = 4*10 = 40, current 100 → negative → clamp 0
    expect(plan.recommended_order).toBe(0);
  });

  it("returns positive order when stock is short", () => {
    const plan = recommendReorder({
      dailyDemand: [10, 10, 10],
      currentUnits: 5,
      leadDays: 10,
      bufferDays: 4,
    });
    expect(plan.recommended_order).toBeGreaterThan(0);
    expect(plan.cover_days).toBe(14);
  });

  it("grades confidence from observed (non-zero) demand days, not window length", () => {
    // A 90-day window with only 3 actual sales days is low confidence, not high.
    const sparse = [5, 0, 0, 8, 0, 0, 0, 6, ...Array(82).fill(0)];
    const plan = recommendReorder({
      dailyDemand: sparse,
      currentUnits: 0,
      leadDays: 10,
      bufferDays: 4,
    });
    expect(plan.window_days).toBe(90);
    expect(plan.observed_days).toBe(3);
    expect(plan.confidence).toBe("low");

    expect(recommendReorder({ dailyDemand: Array(12).fill(1), currentUnits: 0, leadDays: 1, bufferDays: 0 }).confidence).toBe("high");
    expect(recommendReorder({ dailyDemand: Array(2).fill(1), currentUnits: 0, leadDays: 1, bufferDays: 0 }).confidence).toBe("none");
  });
});
