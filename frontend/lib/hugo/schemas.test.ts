import { describe, expect, it } from "vitest";

import { investigateBodySchema } from "./schemas";

const INCIDENT_ID = "550e8400-e29b-41d4-a716-446655440001";
const PRODUCT_ID = "550e8400-e29b-41d4-a716-446655440002";

describe("investigateBodySchema", () => {
  it("accepts uuid incident and product ids", () => {
    const parsed = investigateBodySchema.safeParse({
      incident_id: INCIDENT_ID,
      product_id: PRODUCT_ID,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-uuid ids", () => {
    const parsed = investigateBodySchema.safeParse({
      incident_id: "inc-1",
      product_id: PRODUCT_ID,
    });
    expect(parsed.success).toBe(false);
  });
});
