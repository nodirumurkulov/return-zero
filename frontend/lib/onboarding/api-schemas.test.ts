import { describe, expect, it } from "vitest";
import {
  onboardingUploadPartialResponseSchema,
  onboardingUploadResponseSchema,
  onboardingUploadSuccessResponseSchema,
} from "./api-schemas";

describe("onboardingUploadResponseSchema", () => {
  it("accepts success responses", () => {
    const parsed = onboardingUploadSuccessResponseSchema.safeParse({
      success: true,
      results: [{ table: "orders", count: 10 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts partial failure responses", () => {
    const parsed = onboardingUploadPartialResponseSchema.safeParse({
      success: false,
      results: [{ table: "orders", count: 0, error: "bad row" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts error-only responses", () => {
    const parsed = onboardingUploadResponseSchema.safeParse({ error: "No CSV files provided" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys on success body", () => {
    const parsed = onboardingUploadSuccessResponseSchema.safeParse({
      success: true,
      results: [],
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });
});
