import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { recoverMock } = vi.hoisted(() => ({ recoverMock: vi.fn() }));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ incidents: { recover: recoverMock } })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/organizations", () => ({
  listAllOrganizationIds: vi.fn(async () => ["org-1"]),
  requireOrganizationId: vi.fn(async () => "org-1"),
}));

import { POST } from "@/app/api/stores/incidents/recover/route";

describe("POST /api/stores/incidents/recover", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    recoverMock.mockResolvedValue({ monitored: 1, updated: 1, resolved: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects invalid advance_days body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/recover", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: "seven" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(recoverMock).not.toHaveBeenCalled();
  });

  it("delegates to recover with parsed body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/recover", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: 7 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(recoverMock).toHaveBeenCalledWith({ organizationId: "org-1", advanceDays: 7 });
  });
});
