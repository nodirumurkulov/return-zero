import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { detectMock, notifyNewMock } = vi.hoisted(() => ({
  detectMock: vi.fn(),
  notifyNewMock: vi.fn(),
}));

const adminSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => {
        const result = Promise.resolve({ data: [{ id: "prod-1" }], error: null });
        return Object.assign(result, {
          eq: vi.fn(() => Promise.resolve({ data: [{ id: "prod-1" }], error: null })),
        });
      }),
    })),
  })),
};

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: {
      detect: detectMock,
      notifyNew: notifyNewMock,
    },
  })),
}));

vi.mock("@/lib/hugo/investigate-incident", () => ({
  investigateCreatedIncidents: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => adminSupabase),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null } })) },
    }),
  ),
}));

vi.mock("@/lib/tenancy/server", () => ({
  listAllStoreScopes: vi.fn(() =>
    Promise.resolve([{ organizationId: "org-1", storeId: "store-1" }]),
  ),
}));

import { POST } from "@/app/api/stores/incidents/detect/route";

describe("POST /api/stores/incidents/detect", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    detectMock.mockResolvedValue({
      scanned: 3,
      created: [
        {
          incident_id: "inc-1",
          product_id: "prod-1",
          title: "Test",
          severity: "high",
          affected_kpi_keys: ["stock"],
          impact_amount: 1000,
        },
      ],
      skipped: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron credentials when secret is set", async () => {
    const res = await POST(new NextRequest("http://localhost/api/stores/incidents/detect", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(detectMock).not.toHaveBeenCalled();
  });

  it("returns 401 without session when CRON_SECRET is unset in development", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await POST(new NextRequest("http://localhost/api/stores/incidents/detect", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(detectMock).not.toHaveBeenCalled();
  });

  it("runs detection when cron auth is valid", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/detect", {
        method: "POST",
        headers: { authorization: "Bearer cron-test-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; created: number };
    expect(json.success).toBe(true);
    expect(json.created).toBe(1);
    expect(detectMock).toHaveBeenCalled();
    expect(notifyNewMock).toHaveBeenCalled();
  });
});
