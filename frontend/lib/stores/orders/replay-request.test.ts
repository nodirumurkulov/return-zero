import { describe, expect, it } from "vitest";
import { replayBodySchema } from "./replay-request";

describe("replayBodySchema", () => {
  it("accepts reset flag", () => {
    expect(replayBodySchema.safeParse({ reset: true }).success).toBe(true);
  });

  it("rejects non-positive advance_days", () => {
    expect(replayBodySchema.safeParse({ advance_days: 0 }).success).toBe(false);
    expect(replayBodySchema.safeParse({ advance_days: -1 }).success).toBe(false);
  });
});
