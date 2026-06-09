/**
 * @vitest-environment node
 *
 * happy-dom strips the `origin` header (it's a forbidden request header per the
 * Fetch spec). CSRF verification depends on reading Origin, so these tests run
 * in the `node` environment where Headers behaves like the real server runtime.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyCsrfOrigin } from "./csrf";

const APP_URL = "https://hugo.example.com";

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
): NextRequest {
  const hdrs = new Headers(headers);
  return new NextRequest(`${APP_URL}${path}`, { method, headers: hdrs });
}

describe("verifyCsrfOrigin", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it("allows GET requests without Origin", () => {
    const result = verifyCsrfOrigin(request("GET", "/api/stores/incidents/1"));
    expect(result.allowed).toBe(true);
  });

  it("allows HEAD and OPTIONS without Origin", () => {
    expect(verifyCsrfOrigin(request("HEAD", "/api/incidents")).allowed).toBe(true);
    expect(verifyCsrfOrigin(request("OPTIONS", "/api/incidents")).allowed).toBe(true);
  });

  it("allows POST with matching Origin", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/stores/incidents/1/approve", {
        origin: APP_URL,
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("allows PATCH with matching Origin", () => {
    const result = verifyCsrfOrigin(
      request("PATCH", "/api/stores/incidents/1", {
        origin: APP_URL,
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("rejects POST with mismatched Origin", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/stores/incidents/1/approve", {
        origin: "https://evil.com",
      }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Origin mismatch");
      expect(result.reason).toContain("evil.com");
    }
  });

  it("falls back to Referer when Origin is missing", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/investigate", {
        referer: `${APP_URL}/incidents/123`,
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("rejects when Referer origin does not match", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/investigate", {
        referer: "https://evil.com/page",
      }),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Referer origin mismatch");
    }
  });

  it("rejects POST with no Origin and no Referer", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/stores/incidents/1/approve"),
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toContain("Missing Origin and Referer");
    }
  });

  it("exempts Slack webhook routes", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/slack/webhook", {
        origin: "https://slack.com",
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("exempts Slack events routes", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/slack/events", {
        origin: "https://slack.com",
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("exempts waitlist routes", () => {
    expect(
      verifyCsrfOrigin(
        request("POST", "/api/waitlist", { origin: "https://other.com" }),
      ).allowed,
    ).toBe(true);
    expect(
      verifyCsrfOrigin(
        request("POST", "/api/waitlist/pricing/chat", { origin: "https://other.com" }),
      ).allowed,
    ).toBe(true);
  });

  it("exempts Shopify OAuth routes", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/shopify/callback", {
        origin: "https://myshop.myshopify.com",
      }),
    );
    expect(result.allowed).toBe(true);
  });

  it("exempts digest cron route", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/api/digest", { origin: "https://vercel.com" }),
    );
    expect(result.allowed).toBe(true);
  });

  it("skips non-API paths", () => {
    const result = verifyCsrfOrigin(
      request("POST", "/auth/callback", { origin: "https://other.com" }),
    );
    expect(result.allowed).toBe(true);
  });

  it("defaults to localhost:3000 when NEXT_PUBLIC_APP_URL is unset", () => {
    process.env.NEXT_PUBLIC_APP_URL = "";
    const req = new NextRequest("http://localhost:3000/api/investigate", {
      method: "POST",
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    expect(verifyCsrfOrigin(req).allowed).toBe(true);
  });

  it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = `${APP_URL}/`;
    const result = verifyCsrfOrigin(
      request("POST", "/api/investigate", { origin: APP_URL }),
    );
    expect(result.allowed).toBe(true);
  });
});
