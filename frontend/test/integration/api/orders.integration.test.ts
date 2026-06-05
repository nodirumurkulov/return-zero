import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { replayStoreMock } = vi.hoisted(() => ({
  replayStoreMock: { listIncomingOrders: vi.fn(), dataEndDate: vi.fn() },
}));

vi.mock("@/lib/stores/analytics/replay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stores/analytics/replay")>();
  return {
    ...actual,
    createReplay: vi.fn(() => replayStoreMock),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  tryRequireOrganizationId: vi.fn(),
}));

import { GET } from "@/app/api/orders/route";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const listIncomingOrdersMock = replayStoreMock.listIncomingOrders;
const dataEndDateMock = replayStoreMock.dataEndDate;
const createClientMock = vi.mocked(createClient);
const tryRequireOrganizationIdMock = vi.mocked(tryRequireOrganizationId);

describe("GET /api/orders", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await GET(new NextRequest("http://localhost/api/orders?after=2024-01-01T00:00:00Z"));
    expect(res.status).toBe(401);
  });

  it("returns orders feed for authenticated org member", async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: { replay_cursor: "2024-06-01" }, error: null }),
          }),
        }),
      }),
    };
    createClientMock.mockResolvedValue(supabase as never);
    tryRequireOrganizationIdMock.mockResolvedValue({
      ok: true,
      organizationId: "org-1",
    });
    listIncomingOrdersMock.mockResolvedValue([{ id: "order-1" }] as never);
    dataEndDateMock.mockResolvedValue("2024-12-31");

    const res = await GET(new NextRequest("http://localhost/api/orders?after=2024-01-01T00:00:00Z&limit=10"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { orders: unknown[]; cursor: string; data_end: string };
    expect(json.orders).toHaveLength(1);
    expect(json.cursor).toBe("2024-06-01");
    expect(json.data_end).toBe("2024-12-31");
  });
});
