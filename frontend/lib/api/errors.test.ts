import { describe, expect, it } from "vitest";

import { ApiError, assertApiData } from "./errors";

describe("ApiError", () => {
  it("extracts message from error body", () => {
    const err = ApiError.fromBody(400, { error: "Invalid request" });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("Invalid request");
  });

  it("uses fallback when body has no error field", () => {
    const err = ApiError.fromBody(500, { detail: "nope" }, "Server error");
    expect(err.message).toBe("Server error");
  });
});

describe("assertApiData", () => {
  it("returns data when no error", () => {
    expect(assertApiData({ ok: true }, undefined)).toEqual({ ok: true });
  });

  it("rethrows ApiError", () => {
    const err = new ApiError(403, "Forbidden");
    expect(() => assertApiData(undefined, err)).toThrow(err);
  });
});
