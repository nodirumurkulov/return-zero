import { describe, expect, it } from "vitest";

import { advanceBodySchema } from "./types";

describe("advanceBodySchema", () => {
  it("accepts reset flag", () => {
    expect(advanceBodySchema.safeParse({ reset: true }).success).toBe(true);
  });

  it("rejects non-positive advance_days", () => {
    expect(advanceBodySchema.safeParse({ advance_days: 0 }).success).toBe(false);
    expect(advanceBodySchema.safeParse({ advance_days: -1 }).success).toBe(false);
  });
});
