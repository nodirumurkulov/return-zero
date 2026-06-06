import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { listIncidentsMock, postWebhookBlocksMock } = vi.hoisted(() => ({
  listIncidentsMock: vi.fn(),
  postWebhookBlocksMock: vi.fn(),
}));
vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: { list: listIncidentsMock },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
          Promise.resolve({
            data: { name: "Pretty Fly" },
            error: null,
          }),
        ),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null } })) },
    }),
  ),
}));

vi.mock("@/lib/organizations", () => ({
  listAllOrganizationIds: vi.fn(() => Promise.resolve(["org-1"])),
  requireOrganizationId: vi.fn(() => Promise.resolve("org-1")),
}));

vi.mock("@/lib/slack", () => ({
  postWebhookBlocks: postWebhookBlocksMock,
}));

import { GET } from "@/app/api/digest/route";

describe("GET /api/digest", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    listIncidentsMock.mockResolvedValue([]);
    postWebhookBlocksMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron secret", async () => {
    const req = new NextRequest("http://localhost/api/digest", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("posts digest via webhook in cron mode", async () => {
    const req = new NextRequest("http://localhost/api/digest", {
      method: "GET",
      headers: { authorization: "Bearer cron-test-secret" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; digests: unknown[] };
    expect(body.success).toBe(true);
    expect(body.digests).toHaveLength(1);
    expect(postWebhookBlocksMock).toHaveBeenCalledTimes(1);
  });

  it("includes open count in response", async () => {
    listIncidentsMock.mockResolvedValue([
      {
        id: "inc-1",
        organization_id: "org-1",
        title: "Spike",
        status: "detected",
        severity: "high",
        impact_amount: 5000,
        impact_label: null,
        product_id: null,
        affected_kpi_keys: [],
        root_cause: null,
        root_cause_confidence: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        resolved_at: null,
        investigation_started_at: null,
        fix_proposed_at: null,
        monitoring_started_at: null,
        monitoring_kpi: null,
        baseline_value: null,
        target_value: null,
        recovery_pct: 0,
      },
    ]);

    const req = new NextRequest("http://localhost/api/digest", {
      method: "GET",
      headers: { authorization: "Bearer cron-test-secret" },
    });

    const res = await GET(req);
    const body = (await res.json()) as { digests: { openCount: number }[] };
    expect(body.digests[0].openCount).toBe(1);
  });
});
