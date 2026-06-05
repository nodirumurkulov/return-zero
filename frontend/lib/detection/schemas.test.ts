import { describe, expect, it } from "vitest";
import { recoverBodySchema } from "./schemas";

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
