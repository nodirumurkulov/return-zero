import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/hugo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/hugo")>();
  return {
    ...actual,
    runIncidentInvestigation: vi.fn(),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  requireOrganizationId: vi.fn(),
}));

import { POST } from "@/app/api/investigate/route";
import { runIncidentInvestigation } from "@/lib/hugo";
import { requireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const runIncidentInvestigationMock = vi.mocked(runIncidentInvestigation);
const createClientMock = vi.mocked(createClient);
const requireOrganizationIdMock = vi.mocked(requireOrganizationId);

const INCIDENT_ID = "550e8400-e29b-41d4-a716-446655440001";
const PRODUCT_ID = "550e8400-e29b-41d4-a716-446655440002";

describe("POST /api/investigate", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for non-uuid incident_id", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ incident_id: "inc-1", product_id: PRODUCT_ID }),
      }),
    );
    expect(res.status).toBe(400);
    expect(runIncidentInvestigationMock).not.toHaveBeenCalled();
  });

  it("returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ incident_id: INCIDENT_ID, product_id: PRODUCT_ID }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("runs Hugo investigation for authenticated user", async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
      from: () => ({
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    };
    createClientMock.mockResolvedValue(supabase as never);
    requireOrganizationIdMock.mockResolvedValue("org-1");
    runIncidentInvestigationMock.mockResolvedValue({
      root_cause: "Supplier defect",
      root_cause_confidence: 90,
      findings_count: 2,
      actions_count: 1,
    });

    const res = await POST(
      new NextRequest("http://localhost/api/investigate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ incident_id: INCIDENT_ID, product_id: PRODUCT_ID }),
      }),
    );
    expect(res.status).toBe(200);
    expect(runIncidentInvestigationMock).toHaveBeenCalledWith(supabase, INCIDENT_ID, PRODUCT_ID);
  });
});
