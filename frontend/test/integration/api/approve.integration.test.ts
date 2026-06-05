import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/incidents", () => ({
  approveIncidentActions: vi.fn(),
  getIncident: vi.fn(),
  listLowRiskProposedActionIds: vi.fn(),
}));

vi.mock("@/lib/detection/recover", () => ({
  captureRecoveryBaseline: vi.fn(),
}));

vi.mock("@/lib/slack", () => ({
  sendIncidentNotification: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  tryRequireOrganizationId: vi.fn(),
}));

import { POST } from "@/app/api/incidents/[id]/approve/route";
import {
  approveIncidentActions,
  getIncident,
  listLowRiskProposedActionIds,
} from "@/lib/incidents";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const approveMock = vi.mocked(approveIncidentActions);
const getIncidentMock = vi.mocked(getIncident);
const listLowRiskMock = vi.mocked(listLowRiskProposedActionIds);
const createClientMock = vi.mocked(createClient);
const tryRequireOrganizationIdMock = vi.mocked(tryRequireOrganizationId);

describe("POST /api/incidents/[id]/approve", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/incidents/inc-1/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action_ids: ["a1"] }),
      }),
      { params: Promise.resolve({ id: "inc-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/incidents/inc-1/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action_ids: [""] }),
      }),
      { params: Promise.resolve({ id: "inc-1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("approves low-risk actions for authenticated user", async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    };
    createClientMock.mockResolvedValue(supabase as never);
    tryRequireOrganizationIdMock.mockResolvedValue({
      ok: true,
      organizationId: "00000000-0000-0000-0000-000000000100",
    });
    listLowRiskMock.mockResolvedValue(["low-1"]);
    approveMock.mockResolvedValue({ approved: 1 });
    getIncidentMock.mockResolvedValue({
      id: "inc-1",
      organization_id: "00000000-0000-0000-0000-000000000100",
      title: "Test",
      status: "awaiting_approval",
      severity: "high",
      impact_amount: 1000,
      impact_label: "GBP",
      product_id: null,
      affected_kpi_keys: [],
      root_cause: null,
      root_cause_confidence: null,
      recovery_pct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      monitoring_kpi: null,
      baseline_value: null,
      target_value: null,
      investigation_started_at: null,
      fix_proposed_at: null,
      monitoring_started_at: null,
    });

    const res = await POST(
      new NextRequest("http://localhost/api/incidents/inc-1/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approve_all_low_risk: true }),
      }),
      { params: Promise.resolve({ id: "inc-1" }) },
    );
    expect(res.status).toBe(200);
    expect(approveMock).toHaveBeenCalledWith(supabase, "inc-1", ["low-1"], "user-1");
  });
});
