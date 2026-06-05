import { describe, expect, it } from "vitest";
import {
  confidenceFromN,
  confidenceInterval,
  isAnomalous,
  zScore,
} from "./spc";

describe("zScore", () => {
  it("computes (value-mean)/stddev", () => {
    expect(zScore(12, 10, 2)).toBeCloseTo(1, 6);
    expect(zScore(6, 10, 2)).toBeCloseTo(-2, 6);
  });

  it("returns null when stddev is zero or negative", () => {
    expect(zScore(12, 10, 0)).toBeNull();
    expect(zScore(12, 10, -1)).toBeNull();
  });

  it("returns null on non-finite inputs", () => {
    expect(zScore(Number.NaN, 10, 2)).toBeNull();
    expect(zScore(12, Number.NaN, 2)).toBeNull();
  });
});

describe("confidenceFromN — boundaries", () => {
  it("grades at 2/3/5/6/11/12", () => {
    expect(confidenceFromN(2)).toBe("none");
    expect(confidenceFromN(3)).toBe("low");
    expect(confidenceFromN(5)).toBe("low");
    expect(confidenceFromN(6)).toBe("moderate");
    expect(confidenceFromN(11)).toBe("moderate");
    expect(confidenceFromN(12)).toBe("high");
  });
});

describe("confidenceInterval", () => {
  it("is mean ± 1.96·σ/√n", () => {
    const ci = confidenceInterval(10, 4, 4);
    expect(ci).not.toBeNull();
    expect(ci!.lower).toBeCloseTo(6.08, 6);
    expect(ci!.upper).toBeCloseTo(13.92, 6);
  });

  it("widens as n shrinks", () => {
    const wide = confidenceInterval(10, 4, 4)!;
    const narrow = confidenceInterval(10, 4, 16)!;
    expect(wide.upper - wide.lower).toBeGreaterThan(narrow.upper - narrow.lower);
  });

  it("returns null when n<1", () => {
    expect(confidenceInterval(10, 4, 0)).toBeNull();
  });
});

describe("isAnomalous — |z|≥2 AND n≥6", () => {
  it("flags only when both hold", () => {
    expect(isAnomalous(2.5, 6)).toBe(true);
    expect(isAnomalous(-2.5, 12)).toBe(true);
  });

  it("suppresses on thin data even with large z", () => {
    expect(isAnomalous(3, 5)).toBe(false);
  });

  it("does not flag sub-threshold z", () => {
    expect(isAnomalous(1.9, 12)).toBe(false);
  });

  it("returns false for null/non-finite z", () => {
    expect(isAnomalous(null, 12)).toBe(false);
    expect(isAnomalous(Number.POSITIVE_INFINITY, 12)).toBe(false);
  });
});
