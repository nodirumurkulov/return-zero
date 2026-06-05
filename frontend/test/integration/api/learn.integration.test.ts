import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/stores/analytics/learn/baselines", () => ({
  learnBaselines: vi.fn(),
}));

vi.mock("@/lib/stores/analytics/learn/report", () => ({
  buildBusinessReport: vi.fn(),
}));

const { replayStoreMock } = vi.hoisted(() => ({
  replayStoreMock: { reset: vi.fn() },
}));

vi.mock("@/lib/stores/analytics/replay", () => ({
  createReplay: vi.fn(() => replayStoreMock),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
  })),
}));

vi.mock("@/lib/organizations", () => ({
  tryRequireOrganizationId: vi.fn(async () => ({ ok: true, organizationId: "org-1" })),
}));

import { POST } from "@/app/api/learn/route";
import { learnBaselines } from "@/lib/stores/analytics/learn/baselines";
import { buildBusinessReport } from "@/lib/stores/analytics/learn/report";

const learnBaselinesMock = vi.mocked(learnBaselines);
const buildBusinessReportMock = vi.mocked(buildBusinessReport);
const resetReplayMock = replayStoreMock.reset;

describe("POST /api/learn", () => {
  beforeEach(() => {
    learnBaselinesMock.mockResolvedValue({ baselines: 1, thresholds: 1, products: 1 });
    buildBusinessReportMock.mockResolvedValue({ id: "report-1" } as never);
    resetReplayMock.mockResolvedValue({ cursor: "2024-01-01" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without authenticated user", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
    expect(learnBaselinesMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extra: true }),
      }),
    );
    expect(res.status).toBe(400);
    expect(learnBaselinesMock).not.toHaveBeenCalled();
  });

  it("runs learn pipeline for authenticated org member", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; reportId: string };
    expect(json.success).toBe(true);
    expect(json.reportId).toBe("report-1");
    expect(learnBaselinesMock).toHaveBeenCalled();
    expect(buildBusinessReportMock).toHaveBeenCalled();
    expect(resetReplayMock).toHaveBeenCalled();
  });
});
