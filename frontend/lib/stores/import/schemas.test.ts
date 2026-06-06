import { describe, expect, it } from "vitest";

import {
  importImportingResponseSchema,
  importPartialResponseSchema,
  importResponseSchema,
  importSkippedResponseSchema,
  importSuccessResponseSchema,
} from "./types";

describe("importResponseSchema", () => {
  it("accepts success responses", () => {
    const parsed = importSuccessResponseSchema.safeParse({
      success: true,
      results: [{ table: "orders", count: 10 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts partial failure responses", () => {
    const parsed = importPartialResponseSchema.safeParse({
      success: false,
      results: [{ table: "orders", count: 0, error: "bad row" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts importing responses", () => {
    const parsed = importImportingResponseSchema.safeParse({ importing: true });
    expect(parsed.success).toBe(true);
  });

  it("accepts skipped responses", () => {
    const parsed = importSkippedResponseSchema.safeParse({ skipped: true });
    expect(parsed.success).toBe(true);
  });

  it("accepts error-only responses", () => {
    const parsed = importResponseSchema.safeParse({ error: "Import failed" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys on success body", () => {
    const parsed = importSuccessResponseSchema.safeParse({
      success: true,
      results: [],
      extra: true,
    });
    expect(parsed.success).toBe(false);
  });
});
