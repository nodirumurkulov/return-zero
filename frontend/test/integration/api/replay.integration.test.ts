import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { replayStoreMock } = vi.hoisted(() => ({
  replayStoreMock: { run: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/stores/analytics/replay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stores/analytics/replay")>();
  return {
    ...actual,
    createReplay: vi.fn(() => replayStoreMock),
  };
});

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

import { POST } from "@/app/api/replay/route";
const runReplayMock = replayStoreMock.run;

const replayResult = {
  previous_cursor: "2024-01-01",
  cursor: "2024-01-08",
  at_end: false,
  breaches: { scanned: 1, created: [], skipped: [] },
  forecast: { scanned: 1, created: [], skipped: [] },
};

describe("POST /api/replay", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    runReplayMock.mockResolvedValue(replayResult);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron credentials when secret is set", async () => {
    const res = await POST(new NextRequest("http://localhost/api/replay", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(runReplayMock).not.toHaveBeenCalled();
  });

  it("delegates to runReplay with parsed advance_days", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/replay", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: 3 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(runReplayMock).toHaveBeenCalledWith({ organizationId: "org-1", advanceDays: 3 });
  });
});
