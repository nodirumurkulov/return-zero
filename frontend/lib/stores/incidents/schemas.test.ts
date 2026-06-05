import { describe, expect, it } from "vitest";
import {
  approveIncidentBodySchema,
  recoverBodySchema,
  updateIncidentBodySchema,
} from "./schemas";

describe("updateIncidentBodySchema", () => {
  it("accepts partial updates", () => {
    const parsed = updateIncidentBodySchema.safeParse({ status: "monitoring" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys", () => {
    const parsed = updateIncidentBodySchema.safeParse({ status: "monitoring", extra: true });
    expect(parsed.success).toBe(false);
  });

  it("rejects organization_id mass-assignment", () => {
    const parsed = updateIncidentBodySchema.safeParse({
      organization_id: "00000000-0000-0000-0000-000000000001",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const parsed = updateIncidentBodySchema.safeParse({ status: "not-a-status" });
    expect(parsed.success).toBe(false);
  });
});

describe("approveIncidentBodySchema", () => {
  it("accepts action_ids", () => {
    const parsed = approveIncidentBodySchema.safeParse({ action_ids: ["a1"] });
    expect(parsed.success).toBe(true);
  });

  it("accepts approve_all_low_risk flag", () => {
    const parsed = approveIncidentBodySchema.safeParse({ approve_all_low_risk: true });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty action id strings", () => {
    const parsed = approveIncidentBodySchema.safeParse({ action_ids: [""] });
    expect(parsed.success).toBe(false);
  });
});

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
