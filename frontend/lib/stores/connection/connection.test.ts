import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { StoreConnectionDomain } from "./connection";

vi.mock("@/lib/shopify/server", () => ({
  upsertStoreSecret: vi.fn().mockResolvedValue(undefined),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

function chainMock(responses: QueryResult[]) {
  const queue = [...responses];
  const from = vi.fn(() => {
    const result = queue.shift() ?? { data: null, error: null };
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      update: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      single: vi.fn(() => Promise.resolve(result)),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      then: (
        onfulfilled?: (v: QueryResult) => unknown,
        onrejected?: (e: unknown) => unknown,
      ) => Promise.resolve(result).then(onfulfilled, onrejected),
    };
    return builder;
  });
  const supabase = { from } as unknown as SupabaseClient<Database>;
  return { supabase, from };
}

describe("StoreConnectionDomain.connectShopify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a new Shopify store and sets active_store_id when unset", async () => {
    const { supabase } = chainMock([
      { data: null, error: null },
      { data: { id: "store-new" }, error: null },
      { data: { active_store_id: null }, error: null },
      { data: null, error: null },
    ]);
    const domain = new StoreConnectionDomain(supabase);

    const result = await domain.connectShopify({
      organizationId: "org-1",
      externalShopId: "demo.myshopify.com",
      label: "Demo Shop",
      accessToken: "shpat_test",
      scopes: "read_products",
    });

    expect(result).toEqual({
      storeId: "store-new",
      organizationId: "org-1",
      created: true,
    });
  });

  it("refreshes an existing Shopify store without forcing active_store_id", async () => {
    const { supabase } = chainMock([
      { data: { id: "store-existing" }, error: null },
      { data: null, error: null },
      { data: { active_store_id: "other-store" }, error: null },
    ]);
    const domain = new StoreConnectionDomain(supabase);

    const result = await domain.connectShopify({
      organizationId: "org-1",
      externalShopId: "demo.myshopify.com",
      label: "Demo Shop",
      accessToken: "shpat_test",
      scopes: "read_products",
    });

    expect(result).toEqual({
      storeId: "store-existing",
      organizationId: "org-1",
      created: false,
    });
  });

  it("forces active_store_id when activateStore is true", async () => {
    const { supabase, from } = chainMock([
      { data: { id: "store-existing" }, error: null },
      { data: null, error: null },
      { data: { active_store_id: "other-store" }, error: null },
      { data: null, error: null },
    ]);
    const domain = new StoreConnectionDomain(supabase);

    await domain.connectShopify({
      organizationId: "org-1",
      externalShopId: "demo.myshopify.com",
      label: "Demo Shop",
      accessToken: "shpat_test",
      scopes: "read_products",
      activateStore: true,
    });

    expect(from).toHaveBeenCalledTimes(4);
  });
});

describe("StoreConnectionDomain.list", () => {
  it("maps store connection rows", async () => {
    const { supabase } = chainMock([
      {
        data: [
          {
            id: "store-1",
            label: "Demo",
            platform: "shopify",
            status: "syncing",
            external_shop_id: "demo.myshopify.com",
            connected_at: null,
          },
        ],
        error: null,
      },
    ]);
    const domain = new StoreConnectionDomain(supabase);

    await expect(domain.list({ organizationId: "org-1" })).resolves.toEqual([
      {
        id: "store-1",
        label: "Demo",
        platform: "shopify",
        status: "syncing",
        externalShopId: "demo.myshopify.com",
        connectedAt: null,
      },
    ]);
  });
});
