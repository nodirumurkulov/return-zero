import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { approveAndNotifyMock, listActionIdsMock } = vi.hoisted(() => ({
  approveAndNotifyMock: vi.fn(),
  listActionIdsMock: vi.fn(),
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    incidents: {
      listActionIds: listActionIdsMock,
      approveAndNotify: approveAndNotifyMock,
    },
  })),
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

import { POST } from "@/app/api/stores/incidents/[id]/approve/route";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const createClientMock = vi.mocked(createClient);
const tryRequireOrganizationIdMock = vi.mocked(tryRequireOrganizationId);

describe("POST /api/stores/incidents/[id]/approve", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/inc-1/approve", {
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
    tryRequireOrganizationIdMock.mockResolvedValue({
      ok: true,
      organizationId: "00000000-0000-0000-0000-000000000100",
    });

    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/inc-1/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action_ids: [""] }),
      }),
      { params: Promise.resolve({ id: "inc-1" }) },
    );
    expect(res.status).toBe(400);
  });

  it("approves low-risk actions for authenticated user", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    } as never);
    tryRequireOrganizationIdMock.mockResolvedValue({
      ok: true,
      organizationId: "00000000-0000-0000-0000-000000000100",
    });
    listActionIdsMock.mockResolvedValue(["low-1"]);
    approveAndNotifyMock.mockResolvedValue(undefined);

    const res = await POST(
      new NextRequest("http://localhost/api/stores/incidents/inc-1/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approve_all_low_risk: true }),
      }),
      { params: Promise.resolve({ id: "inc-1" }) },
    );
    expect(res.status).toBe(200);
    expect(listActionIdsMock).toHaveBeenCalledWith({
      incidentId: "inc-1",
      organizationId: "00000000-0000-0000-0000-000000000100",
      filter: { status: "proposed", riskLevel: "low" },
    });
    expect(approveAndNotifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentId: "inc-1",
        actionIds: ["low-1"],
        approvedByUserId: "user-1",
        organizationId: "00000000-0000-0000-0000-000000000100",
      }),
    );
    const approveArgs = approveAndNotifyMock.mock.calls[0]?.[0] as
      | { appUrl?: string }
      | undefined;
    expect(typeof approveArgs?.appUrl).toBe("string");
  });
});
