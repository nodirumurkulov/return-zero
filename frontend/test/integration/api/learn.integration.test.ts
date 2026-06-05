import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { learnRunMock } = vi.hoisted(() => ({
  learnRunMock: vi.fn(),
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ learn: { run: learnRunMock } })),
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

import { POST } from "@/app/api/stores/learn/route";

describe("POST /api/stores/learn", () => {
  beforeEach(() => {
    learnRunMock.mockResolvedValue({
      learn: { baselines: 1, thresholds: 1, products: 1 },
      reportId: "report-1",
      replayCursor: "2024-01-01",
    });
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
      new NextRequest("http://localhost/api/stores/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
    expect(learnRunMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extra: true }),
      }),
    );
    expect(res.status).toBe(400);
    expect(learnRunMock).not.toHaveBeenCalled();
  });

  it("runs learn pipeline for authenticated org member", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/learn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; reportId: string };
    expect(json.success).toBe(true);
    expect(json.reportId).toBe("report-1");
    expect(learnRunMock).toHaveBeenCalledWith({ organizationId: "org-1" });
  });
});
