import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { forecastMock } = vi.hoisted(() => ({ forecastMock: vi.fn() }));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ incidents: { forecast: forecastMock } })),
  notifyNewIncidents: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
  })),
}));

vi.mock("@/lib/organizations", () => ({
  listAllOrganizationIds: vi.fn(async () => ["org-1"]),
  requireOrganizationId: vi.fn(async () => "org-1"),
}));

import { POST } from "@/app/api/stores/incidents/forecast-risk/route";

describe("POST /api/stores/incidents/forecast-risk", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    forecastMock.mockResolvedValue({ scanned: 2, created: [], skipped: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron credentials when secret is set", async () => {
    const res = await POST(new NextRequest("http://localhost/api/stores/incidents/forecast-risk", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(forecastMock).not.toHaveBeenCalled();
  });

  it("runs forecast when cron auth is valid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/forecast-risk", {
        method: "POST",
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    expect(res.status).toBe(200);
    expect(forecastMock).toHaveBeenCalled();
  });
});
