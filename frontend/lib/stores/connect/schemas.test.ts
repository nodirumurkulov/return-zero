import { describe, expect, it } from "vitest";

import {
  connectPartialResponseSchema,
  connectResponseSchema,
  connectSuccessResponseSchema,
} from "./schemas";

describe("connectResponseSchema", () => {
  it("accepts success responses", () => {
    const parsed = connectSuccessResponseSchema.safeParse({
      success: true,
      results: [{ table: "orders", count: 10 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts partial failure responses", () => {
    const parsed = connectPartialResponseSchema.safeParse({
      success: false,
      results: [{ table: "orders", count: 0, error: "bad row" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts error-only responses", () => {
    const parsed = connectResponseSchema.safeParse({ error: "Connect failed" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys on success body", () => {
    const parsed = connectSuccessResponseSchema.safeParse({
      success: true,
      results: [],
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });
});
