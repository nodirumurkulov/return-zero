import { describe, expect, it } from "vitest";
import { recoverBodySchema, replayBodySchema } from "./schemas";

describe("recoverBodySchema", () => {
  it("accepts empty body", () => {
    expect(recoverBodySchema.safeParse({}).success).toBe(true);
  });

  it("accepts advance_days", () => {
    expect(recoverBodySchema.safeParse({ advance_days: 7 }).success).toBe(true);
  });

  it("rejects non-finite advance_days", () => {
    expect(recoverBodySchema.safeParse({ advance_days: Number.NaN }).success).toBe(false);
  });
});

describe("replayBodySchema", () => {
  it("accepts reset flag", () => {
    expect(replayBodySchema.safeParse({ reset: true }).success).toBe(true);
  });

  it("rejects non-positive advance_days", () => {
    expect(replayBodySchema.safeParse({ advance_days: 0 }).success).toBe(false);
    expect(replayBodySchema.safeParse({ advance_days: -1 }).success).toBe(false);
  });
});
