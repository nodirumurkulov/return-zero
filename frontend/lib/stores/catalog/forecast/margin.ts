// Margin bridge — decomposes net-margin-after-ads against the business target
// margin into named drivers, in both margin-points and £. Pure arithmetic over
// pre-aggregated window totals so it is deterministic and unit-testable; the
// quant tool assembles the inputs from the monthly series, cost rows, and
// line-item discounts.
//
// Everything is expressed as a share of GROSS SALES (net revenue + discounts
// given), so the drivers form a waterfall from the target margin down to the
// realised margin and sum exactly to the gap.

export interface MarginBridgeInput {
  /** Net revenue over the window (after discounts). */
  revenue: number;
  /** Cost of goods sold = units · cost_per_unit. */
  cogs: number;
  /** Discounts given (sum of line_items.total_discount). */
  discounts: number;
  /** Refund value over the window. */
  refunds: number;
  /** Ad spend over the window. */
  adSpend: number;
  /** Target net margin in percent (e.g. 55). */
  targetMarginPct: number;
}

export interface MarginDriver {
  driver: "price" | "cogs" | "discounts" | "refund_drag" | "ad_cost";
  label: string;
  /** Signed contribution in margin points (positive = adds margin). */
  points: number;
  /** Signed contribution in £ over the window. */
  gbp: number;
}

export interface MarginBridge {
  gross_sales: number;
  actual_margin_pct: number;
  target_margin_pct: number;
  /** actual − target (negative = below target). */
  gap_pct: number;
  gap_gbp: number;
  /** Drivers sorted by descending |points|; sum of points === gap_pct. */
  drivers: MarginDriver[];
}

export function marginBridge(input: MarginBridgeInput): MarginBridge {
  const { revenue, cogs, discounts, refunds, adSpend, targetMarginPct } = input;
  const grossSales = revenue + discounts;

  // Guard a zero top line: no activity → flat, zero-driver bridge.
  if (grossSales <= 0) {
    return {
      gross_sales: 0,
      actual_margin_pct: 0,
      target_margin_pct: targetMarginPct,
      gap_pct: -targetMarginPct,
      gap_gbp: 0,
      drivers: [],
    };
  }

  const pct = (x: number) => (x / grossSales) * 100;
  const cogsPct = pct(cogs);
  const discountPct = pct(discounts);
  const refundPct = pct(refunds);
  const adPct = pct(adSpend);

  const actualMarginPct = 100 - cogsPct - discountPct - refundPct - adPct;
  const gapPct = actualMarginPct - targetMarginPct;

  // Waterfall from target: gross headroom over target, eroded by each cost.
  // (100 − target) − cogs% − discount% − refund% − ad% === actual − target.
  const raw: Omit<MarginDriver, "gbp">[] = [
    { driver: "price", label: "Gross headroom over target", points: 100 - targetMarginPct },
    { driver: "cogs", label: "Cost of goods", points: -cogsPct },
    { driver: "discounts", label: "Discounts given", points: -discountPct },
    { driver: "refund_drag", label: "Refund drag", points: -refundPct },
    { driver: "ad_cost", label: "Ad cost", points: -adPct },
  ];

  const drivers: MarginDriver[] = raw
    .map((d) => ({ ...d, gbp: (d.points / 100) * grossSales }))
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

  return {
    gross_sales: grossSales,
    actual_margin_pct: actualMarginPct,
    target_margin_pct: targetMarginPct,
    gap_pct: gapPct,
    gap_gbp: (gapPct / 100) * grossSales,
    drivers,
  };
}
