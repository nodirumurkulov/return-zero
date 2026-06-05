import { describe, expect, it } from "vitest";
import { approveIncidentBodySchema, updateIncidentBodySchema } from "./schemas";

describe("updateIncidentBodySchema", () => {
  it("accepts partial updates", () => {
    const parsed = updateIncidentBodySchema.safeParse({ status: "monitoring" });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown keys", () => {
    const parsed = updateIncidentBodySchema.safeParse({ status: "monitoring", extra: true });
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
