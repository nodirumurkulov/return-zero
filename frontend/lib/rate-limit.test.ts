import { describe, expect, it } from "vitest";
import { getClientIp, RateLimiter } from "./rate-limit";

describe("RateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = new RateLimiter({ limit: 3, windowMs: 60_000 });
    const r1 = limiter.check("ip-1");
    const r2 = limiter.check("ip-1");
    const r3 = limiter.check("ip-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("rejects requests exceeding the limit", () => {
    const limiter = new RateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.check("ip-1");
    limiter.check("ip-1");
    const r3 = limiter.check("ip-1");
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks keys independently", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000 });
    const a = limiter.check("ip-a");
    const b = limiter.check("ip-b");
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(limiter.check("ip-a").allowed).toBe(false);
    expect(limiter.check("ip-b").allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 50 });
    limiter.check("ip-1");
    expect(limiter.check("ip-1").allowed).toBe(false);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(limiter.check("ip-1").allowed).toBe(true);
        resolve();
      }, 60);
    });
  });

  it("returns resetAt in the future", () => {
    const limiter = new RateLimiter({ limit: 5, windowMs: 60_000 });
    const result = limiter.check("ip-1");
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });
});

describe("getClientIp", () => {
  it("extracts first IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "5.6.7.8" });
    expect(getClientIp(headers)).toBe("5.6.7.8");
  });

  it("returns unknown when no IP headers present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
