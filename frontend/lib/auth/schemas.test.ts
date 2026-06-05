import { describe, expect, it } from "vitest";
import { authNextPathSchema } from "./schemas";

describe("authNextPathSchema", () => {
  it("accepts in-app paths", () => {
    expect(authNextPathSchema.safeParse("/incidents").success).toBe(true);
    expect(authNextPathSchema.safeParse("/catalog/foo").success).toBe(true);
    expect(authNextPathSchema.safeParse("/sign-in?next=%2Fcatalog").success).toBe(true);
  });

  it("rejects missing or non-string values", () => {
    expect(authNextPathSchema.safeParse(null).success).toBe(false);
    expect(authNextPathSchema.safeParse(undefined).success).toBe(false);
    expect(authNextPathSchema.safeParse(123).success).toBe(false);
    expect(authNextPathSchema.safeParse("").success).toBe(false);
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(authNextPathSchema.safeParse("https://evil.com").success).toBe(false);
    expect(authNextPathSchema.safeParse("//evil.com").success).toBe(false);
  });
});
