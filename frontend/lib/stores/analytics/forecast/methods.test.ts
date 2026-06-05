import { describe, expect, it } from "vitest";
import { ewma, linearTrend, residualStd, seasonalFactor } from "./methods";

describe("linearTrend", () => {
  it("fits a straight line through evenly spaced points", () => {
    const fit = linearTrend([10, 20, 30]);
    expect(fit.slope).toBeCloseTo(10, 5);
    expect(fit.intercept).toBeCloseTo(10, 5);
  });

  it("returns intercept-only for a single point", () => {
    const fit = linearTrend([42]);
    expect(fit.slope).toBe(0);
    expect(fit.intercept).toBe(42);
  });
});

describe("residualStd", () => {
  it("returns 0 for short series", () => {
    expect(residualStd([1, 2], linearTrend([1, 2]))).toBe(0);
  });
});

describe("ewma", () => {
  it("returns 0 for empty input", () => {
    expect(ewma([])).toBe(0);
  });

  it("smooths toward recent values", () => {
    const value = ewma([10, 10, 30], 0.5);
    expect(value).toBeGreaterThan(10);
    expect(value).toBeLessThan(30);
  });
});

describe("seasonalFactor", () => {
  it("returns 1 without enough history", () => {
    expect(seasonalFactor([1, 2, 3], 12, 0)).toBe(1);
  });
});
