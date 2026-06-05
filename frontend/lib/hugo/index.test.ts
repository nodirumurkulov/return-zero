import { describe, expect, it } from "vitest";
import { needsThreadHistory } from "./index";

describe("needsThreadHistory", () => {
  it("requires history for short ambiguous follow-ups", () => {
    expect(needsThreadHistory("resolve this")).toBe(true);
    expect(needsThreadHistory("investigate the second one")).toBe(true);
    expect(needsThreadHistory("approve it")).toBe(true);
  });

  it("does not require history for long self-contained prompts that include this", () => {
    expect(
      needsThreadHistory(
        "make a plan to resolve this refund-rate incident: refund rate target is 8 percent and puffer jacket is at 26 percent",
      ),
    ).toBe(false);
  });
});
