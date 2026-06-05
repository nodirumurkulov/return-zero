import { describe, expect, it } from "vitest";

import {
  onboardingConnectPartialResponseSchema,
  onboardingConnectResponseSchema,
  onboardingConnectSuccessResponseSchema,
} from "./api-schemas";

describe("onboardingConnectResponseSchema", () => {
  it("accepts success responses", () => {
    const parsed = onboardingConnectSuccessResponseSchema.safeParse({
      success: true,
      results: [{ table: "orders", count: 10 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts partial failure responses", () => {
    const parsed = onboardingConnectPartialResponseSchema.safeParse({
      success: false,
      results: [{ table: "orders", count: 0, error: "bad row" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts error-only responses", () => {
    const parsed = onboardingConnectResponseSchema.safeParse({ error: "Connect failed" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys on success body", () => {
    const parsed = onboardingConnectSuccessResponseSchema.safeParse({
      success: true,
      results: [],
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });
});
