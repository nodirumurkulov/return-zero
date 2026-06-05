import { describe, expect, it } from "vitest";
import { metricStatusFor } from "./engine";

describe("metricStatusFor", () => {
  it.each([
    { value: null, threshold: 10, direction: "above" as const, expected: "healthy" },
    { value: 11, threshold: 10, direction: "above" as const, expected: "critical" },
    { value: 9.5, threshold: 10, direction: "above" as const, expected: "warning" },
    { value: 5, threshold: 10, direction: "above" as const, expected: "healthy" },
    { value: 8, threshold: 10, direction: "below" as const, expected: "critical" },
    { value: 10.5, threshold: 10, direction: "below" as const, expected: "warning" },
  ])("$value vs $threshold ($direction) → $expected", ({ value, threshold, direction, expected }) => {
    expect(metricStatusFor(value, threshold, direction)).toBe(expected);
  });
});
