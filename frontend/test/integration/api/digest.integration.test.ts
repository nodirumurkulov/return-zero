import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fromMock, listIncidentsMock, postOrgSlackBlocksMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  listIncidentsMock: vi.fn(),
  postOrgSlackBlocksMock: vi.fn(),
}));
vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: { list: listIncidentsMock },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: fromMock,
  })),
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

vi.mock("@/lib/slack", () => ({
  postOrgSlackBlocks: postOrgSlackBlocksMock,
}));

import { GET } from "@/app/api/digest/route";

describe("GET /api/digest", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    fromMock.mockImplementation((table: string) => {
      if (table === "organizations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { name: "Hugo mock store" },
                  error: null,
                }),
              ),
            })),
          })),
        };
      }
      return {
        insert: vi.fn(() => Promise.resolve({ error: null })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      };
    });
    listIncidentsMock.mockResolvedValue([]);
    postOrgSlackBlocksMock.mockResolvedValue(undefined);
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

  it("posts digest to org Slack channel in cron mode", async () => {
    const req = new NextRequest("http://localhost/api/digest", {
      method: "GET",
      headers: { authorization: "Bearer cron-test-secret" },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; digests: unknown[] };
    expect(body.success).toBe(true);
    expect(body.digests).toHaveLength(1);
    expect(postOrgSlackBlocksMock).toHaveBeenCalledTimes(1);
    expect(postOrgSlackBlocksMock).toHaveBeenCalledWith(
      expect.anything(),
      "org-1",
      expect.any(Array),
      expect.stringContaining("Daily Digest"),
    );
  });

  it("includes open count in response", async () => {
    listIncidentsMock.mockResolvedValue([
      {
        id: "inc-1",
        organization_id: "org-1",
        store_id: "store-1",
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

  it("posts escalation for stale awaiting-approval incidents", async () => {
    vi.stubEnv("HUGO_ESCALATION_HOURS", "24");
    listIncidentsMock.mockResolvedValue([
      {
        id: "inc-1",
        organization_id: "org-1",
        store_id: "store-1",
        title: "Spike",
        status: "awaiting_approval",
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
    const body = (await res.json()) as {
      escalations: { organizationId: string; count: number }[];
    };

    expect(body.escalations).toEqual([{ organizationId: "org-1", count: 1 }]);
    expect(postOrgSlackBlocksMock).toHaveBeenCalledWith(
      expect.anything(),
      "org-1",
      expect.arrayContaining([
        expect.objectContaining({
          type: "header",
        }),
      ]),
      expect.stringContaining("Escalation"),
    );
  });

  it("skips stale awaiting-approval incidents already escalated today", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "organizations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { name: "Hugo mock store" },
                  error: null,
                }),
              ),
            })),
          })),
        };
      }
      if (table === "incident_timeline") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [{ incident_id: "inc-1", created_at: new Date().toISOString() }],
                  error: null,
                }),
              ),
            })),
          })),
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });
    listIncidentsMock.mockResolvedValue([
      {
        id: "inc-1",
        organization_id: "org-1",
        store_id: "store-1",
        title: "Spike",
        status: "awaiting_approval",
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
    const body = (await res.json()) as {
      escalations: { organizationId: string; count: number }[];
    };

    expect(body.escalations).toEqual([{ organizationId: "org-1", count: 0 }]);
    expect(postOrgSlackBlocksMock).toHaveBeenCalledTimes(1);
  });
});
