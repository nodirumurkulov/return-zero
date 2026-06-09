import { describe, expect, it, vi } from "vitest";

import { getRequestIp, logSecurityEvent } from "./log";

function mockSupabase(insertResult: { error: { message: string } | null }) {
  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue(insertResult),
    }),
  } as never;
}

describe("logSecurityEvent", () => {
  it("inserts a security event with all fields", async () => {
    const supabase = mockSupabase({ error: null });

    await logSecurityEvent(supabase, {
      organization_id: "org-1",
      user_id: "user-1",
      category: "auth",
      action: "sign_in_success",
      severity: "low",
      ip_address: "1.2.3.4",
      user_agent: "Mozilla/5.0",
      metadata: { method: "password" },
    });

    const mock = supabase as unknown as { from: ReturnType<typeof vi.fn> };
    expect(mock.from).toHaveBeenCalledWith("security_events");
  });

  it("does not throw when insert fails", async () => {
    const supabase = mockSupabase({ error: { message: "connection refused" } });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await logSecurityEvent(supabase, {
      category: "api_abuse",
      action: "rate_limit_exceeded",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[audit] security_events insert failed:",
      "connection refused",
    );
    consoleSpy.mockRestore();
  });

  it("defaults severity to low and metadata to empty object", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({ insert: insertFn }),
    } as never;

    await logSecurityEvent(supabase, {
      category: "config_change",
      action: "threshold_updated",
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "low",
        metadata: {},
      }),
    );
  });
});

describe("getRequestIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    });
    expect(getRequestIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip header", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "5.6.7.8" },
    });
    expect(getRequestIp(req)).toBe("5.6.7.8");
  });

  it("returns null when no IP headers present", () => {
    const req = new Request("http://localhost");
    expect(getRequestIp(req)).toBeNull();
  });
});
