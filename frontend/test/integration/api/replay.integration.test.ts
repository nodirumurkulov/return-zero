import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { ordersStoreMock, notifyNewMock } = vi.hoisted(() => ({
  ordersStoreMock: { advance: vi.fn(), reset: vi.fn() },
  notifyNewMock: vi.fn(),
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({
    orders: ordersStoreMock,
    incidents: { notifyNew: notifyNewMock },
  })),
}));

vi.mock("@/lib/hugo/investigate-incident", () => ({
  investigateCreatedIncidents: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
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

import { POST } from "@/app/api/stores/orders/advance/route";

const advanceMock = ordersStoreMock.advance;

const advanceResult = {
  previous_cursor: "2024-01-01",
  cursor: "2024-01-08",
  at_end: false,
  breaches: { scanned: 1, created: [], skipped: [] },
};

describe("POST /api/stores/orders/advance", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    advanceMock.mockResolvedValue(advanceResult);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 401 without cron credentials when secret is set", async () => {
    const res = await POST(new NextRequest("http://localhost/api/stores/orders/advance", { method: "POST" }));
    expect(res.status).toBe(401);
    expect(advanceMock).not.toHaveBeenCalled();
  });

  it("delegates to orders.advance with parsed advance_days", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/stores/orders/advance", {
        method: "POST",
        headers: {
          authorization: "Bearer cron-test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({ advance_days: 3 }),
      }),
    );
    expect(res.status).toBe(200);
    expect(advanceMock).toHaveBeenCalledWith({ organizationId: "org-1", days: 3 });
    expect(notifyNewMock).toHaveBeenCalled();
  });
});
