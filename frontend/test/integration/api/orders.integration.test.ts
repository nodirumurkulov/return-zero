import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { ordersStoreMock } = vi.hoisted(() => ({
  ordersStoreMock: { list: vi.fn(), bounds: vi.fn() },
}));

vi.mock("@/lib/stores/server", () => ({
  getStore: vi.fn(() => ({ orders: ordersStoreMock })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/organizations", () => ({
  tryRequireOrganizationId: vi.fn(),
}));

import { GET } from "@/app/api/stores/orders/feed/route";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { createClient } from "@/lib/supabase/server";

const listMock = ordersStoreMock.list;
const boundsMock = ordersStoreMock.bounds;
const createClientMock = vi.mocked(createClient);
const tryRequireOrganizationIdMock = vi.mocked(tryRequireOrganizationId);

describe("GET /api/stores/orders/feed", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not signed in", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    } as never);

    const res = await GET(new NextRequest("http://localhost/api/stores/orders/feed?after=2024-01-01T00:00:00Z"));
    expect(res.status).toBe(401);
  });

  it("returns orders feed for authenticated org member", async () => {
    const supabase = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    };
    createClientMock.mockResolvedValue(supabase as never);
    tryRequireOrganizationIdMock.mockResolvedValue({
      ok: true,
      organizationId: "org-1",
    });
    listMock.mockResolvedValue([{ order_id: "order-1" }] as never);
    boundsMock.mockResolvedValue({
      cursor: "2024-06-01T00:00:00Z",
      streamStart: "2024-01-01",
      dataEnd: "2024-12-31",
    });

    const res = await GET(new NextRequest("http://localhost/api/stores/orders/feed?after=2024-01-01T00:00:00Z&limit=10"));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { orders: unknown[]; cursor: string; data_end: string };
    expect(json.orders).toHaveLength(1);
    expect(json.cursor).toBe("2024-06-01");
    expect(json.data_end).toBe("2024-12-31");
  });
});
