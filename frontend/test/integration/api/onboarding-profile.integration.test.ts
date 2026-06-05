import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/settings/queries", () => ({
  loadBusinessProfile: vi.fn(),
  loadProductCostRows: vi.fn(),
}));

vi.mock("@/lib/settings/mutations", () => ({
  saveBusinessProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  requireOrganizationId: vi.fn(),
}));

import { GET, POST } from "@/app/api/onboarding/profile/route";
import { saveBusinessProfile } from "@/lib/settings/mutations";
import { loadBusinessProfile, loadProductCostRows } from "@/lib/settings/queries";
import { requireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const loadBusinessProfileMock = vi.mocked(loadBusinessProfile);
const loadProductCostRowsMock = vi.mocked(loadProductCostRows);
const saveBusinessProfileMock = vi.mocked(saveBusinessProfile);
const createClientMock = vi.mocked(createClient);
const requireOrganizationIdMock = vi.mocked(requireOrganizationId);

describe("/api/onboarding/profile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns profile for authenticated org member", async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    };
    createClientMock.mockResolvedValue(supabase as never);
    requireOrganizationIdMock.mockResolvedValue("org-1");
    loadBusinessProfileMock.mockResolvedValue({
      platform: "shopify",
      storeName: "Demo Store",
      primaryGoal: "growth",
      targetMarginPct: 55,
      minRoas: 3,
      leadTimeDays: 71,
      bufferDays: 14,
      heroProductIds: [],
    });
    loadProductCostRowsMock.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as { profile: { storeName: string } };
    expect(json.profile.storeName).toBe("Demo Store");
  });

  it("POST rejects invalid profile body", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    } as never);

    const res = await POST(
      new NextRequest("http://localhost/api/onboarding/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storeName: "" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(saveBusinessProfileMock).not.toHaveBeenCalled();
  });
});
