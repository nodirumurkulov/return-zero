import { describe, expect, it } from "vitest";
import { marginBridge } from "./margin";

describe("marginBridge", () => {
  // gross_sales = 1000 (revenue 900 + discounts 100).
  // cogs 450 (45%), discounts 100 (10%), refunds 50 (5%), ad 40 (4%) → cost 64%
  // actual margin = 36%, target 44% → gap = −8pt, COGS dominant cost.
  const input = {
    revenue: 900,
    cogs: 450,
    discounts: 100,
    refunds: 50,
    adSpend: 40,
    targetMarginPct: 44,
  };

  it("computes actual margin and an ~−8pt gap to target", () => {
    const b = marginBridge(input);
    expect(b.gross_sales).toBe(1000);
    expect(b.actual_margin_pct).toBeCloseTo(36, 6);
    expect(b.gap_pct).toBeCloseTo(-8, 6);
    expect(b.gap_gbp).toBeCloseTo(-80, 6);
  });

  it("drivers sum (in points) to the gap", () => {
    const b = marginBridge(input);
    const sum = b.drivers.reduce((a, d) => a + d.points, 0);
    expect(sum).toBeCloseTo(b.gap_pct, 6);
  });

  it("drivers sum (in £) to the gap in £", () => {
    const b = marginBridge(input);
    const sum = b.drivers.reduce((a, d) => a + d.gbp, 0);
    expect(sum).toBeCloseTo(b.gap_gbp, 6);
  });

  it("ranks the dominant cost driver first among the negatives", () => {
    const b = marginBridge(input);
    const worstCost = b.drivers.filter((d) => d.points < 0)[0];
    expect(worstCost.driver).toBe("cogs");
    expect(worstCost.gbp).toBeCloseTo(-450, 6);
  });

  it("returns a flat zero-driver bridge with no gross sales", () => {
    const b = marginBridge({ ...input, revenue: 0, discounts: 0 });
    expect(b.gross_sales).toBe(0);
    expect(b.drivers).toHaveLength(0);
    expect(b.gap_pct).toBe(-44);
  });
});
