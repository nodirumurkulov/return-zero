import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertCronAuthorized,
  CRON_API_PATHS,
  cronAuthRequired,
  getCronSecret,
  hasCronAuth,
  isCronInvocation,
  isCronSecretConfigured,
  matchesCronPath,
} from "./cron-auth";

function requestWithAuth(auth: string | null): NextRequest {
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);
  return new NextRequest("http://localhost/api/stores/incidents/detect", { headers });
}

describe("cron-auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lists scheduler API paths including replay and digest", () => {
    expect(CRON_API_PATHS).toContain("/api/digest");
    expect(CRON_API_PATHS).toContain("/api/stores/incidents/detect");
    expect(CRON_API_PATHS).toContain("/api/stores/analytics/replay");
  });

  it("matchesCronPath recognizes cron routes", () => {
    expect(matchesCronPath("/api/digest")).toBe(true);
    expect(matchesCronPath("/api/stores/incidents/detect")).toBe(true);
    expect(matchesCronPath("/api/stores/analytics/replay")).toBe(true);
    expect(matchesCronPath("/api/incidents")).toBe(false);
  });

  it("hasCronAuth accepts Bearer and raw secret", () => {
    vi.stubEnv("CRON_SECRET", "test-secret");
    expect(hasCronAuth(requestWithAuth("Bearer test-secret"))).toBe(true);
    expect(hasCronAuth(requestWithAuth("test-secret"))).toBe(true);
    expect(hasCronAuth(requestWithAuth("wrong"))).toBe(false);
  });

  it("assertCronAuthorized returns null when secret unset in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    expect(assertCronAuthorized(requestWithAuth(null))).toBeNull();
  });

  it("assertCronAuthorized returns 401 when secret set but header missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "test-secret");
    const res = assertCronAuthorized(requestWithAuth(null));
    expect(res?.status).toBe(401);
  });

  it("assertCronAuthorized returns 503 in production without CRON_SECRET", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");
    const res = assertCronAuthorized(requestWithAuth("Bearer x"));
    expect(res?.status).toBe(503);
  });

  it("getCronSecret trims whitespace", () => {
    vi.stubEnv("CRON_SECRET", "  abc  ");
    expect(getCronSecret()).toBe("abc");
    expect(isCronSecretConfigured()).toBe(true);
    expect(cronAuthRequired()).toBe(true);
  });

  it("isCronInvocation is false when secret unset even if assert allows through", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "");
    const denied = assertCronAuthorized(requestWithAuth(null));
    expect(denied).toBeNull();
    expect(isCronInvocation(requestWithAuth(null), denied)).toBe(false);
  });

  it("isCronInvocation is true with valid cron credentials", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "test-secret");
    const denied = assertCronAuthorized(requestWithAuth("Bearer test-secret"));
    expect(isCronInvocation(requestWithAuth("Bearer test-secret"), denied)).toBe(true);
  });
});
