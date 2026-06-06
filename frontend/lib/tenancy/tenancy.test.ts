import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

import { TenancyError } from "./errors";
import { Tenancy } from "./tenancy";

type StoreRow = {
  id: string;
  label: string | null;
  platform: "mock_csv" | "shopify";
  status: "pending" | "syncing" | "connected" | "error" | "disconnected";
};

type OrgRow = {
  id: string;
  name: string;
  active_store_id: string | null;
};

function mockSupabaseWithMutableOrg(config: {
  userId?: string | null;
  membership?: { organization_id: string } | null;
  organization: OrgRow;
  stores?: StoreRow[];
}) {
  const organization = { ...config.organization };
  const base = mockSupabase({
    userId: config.userId,
    membership: config.membership,
    organization,
    stores: config.stores,
  });

  return {
    ...base,
    from: (table: string) => {
      if (table === "organizations") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: organization, error: null }),
            }),
          }),
          update: (patch: { active_store_id: string }) => ({
            eq: () => {
              organization.active_store_id = patch.active_store_id;
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      return base.from(table as keyof Database["public"]["Tables"]);
    },
  } as unknown as SupabaseClient<Database>;
}

function mockSupabase(config: {
  userId?: string | null;
  membership?: { organization_id: string } | null;
  organization?: OrgRow | null;
  stores?: StoreRow[];
  updateError?: string | null;
}) {
  const {
    userId = "user-1",
    membership = { organization_id: "org-1" },
    organization = { id: "org-1", name: "Acme", active_store_id: null },
    stores = [
      {
        id: "store-1",
        label: "Main",
        platform: "mock_csv",
        status: "connected",
      },
    ],
    updateError = null,
  } = config;

  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: userId ? { id: userId } : null },
        }),
    },
    from: (table: string) => {
      if (table === "organization_members") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: membership, error: null }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === "organizations") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: organization, error: null }),
            }),
          }),
          update: (patch: { active_store_id: string }) => ({
            eq: () =>
              Promise.resolve({
                error: updateError ? { message: updateError } : null,
                data: organization
                  ? { ...organization, active_store_id: patch.active_store_id }
                  : null,
              }),
          }),
        };
      }

      if (table === "store_connections") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: stores, error: null }),
            }),
          }),
        };
      }

      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<Database>;
}

describe("Tenancy", () => {
  describe("tryGetStoreScope", () => {
    it("returns ok result with store scope", async () => {
      const tenancy = new Tenancy(
        mockSupabase({
          stores: [
            {
              id: "store-1",
              label: "Main",
              platform: "mock_csv",
              status: "connected",
            },
          ],
          organization: {
            id: "org-1",
            name: "Acme",
            active_store_id: "store-1",
          },
        }),
      );
      await expect(tenancy.tryGetStoreScope()).resolves.toEqual({
        ok: true,
        scope: { organizationId: "org-1", storeId: "store-1" },
      });
    });

    it("returns error when membership missing", async () => {
      const tenancy = new Tenancy(mockSupabase({ membership: null }));
      const result = await tenancy.tryGetStoreScope();
      expect(result.ok).toBe(false);
    });
  });

  describe("resolve", () => {
    it("returns org, stores, active store, and scope", async () => {
      const tenancy = new Tenancy(
        mockSupabase({
          stores: [
            {
              id: "store-1",
              label: "Main",
              platform: "mock_csv",
              status: "connected",
            },
            {
              id: "store-2",
              label: "EU",
              platform: "shopify",
              status: "syncing",
            },
          ],
          organization: {
            id: "org-1",
            name: "Acme",
            active_store_id: "store-2",
          },
        }),
      );

      const result = await tenancy.resolve();

      expect(result.organization).toEqual({ id: "org-1", name: "Acme" });
      expect(result.stores).toHaveLength(2);
      expect(result.activeStore.id).toBe("store-2");
      expect(result.scope).toEqual({
        organizationId: "org-1",
        storeId: "store-2",
      });
    });

    it("falls back to first store when active_store_id is unset", async () => {
      const tenancy = new Tenancy(
        mockSupabase({
          organization: { id: "org-1", name: "Acme", active_store_id: null },
          stores: [
            {
              id: "store-1",
              label: "Main",
              platform: "mock_csv",
              status: "connected",
            },
          ],
        }),
      );

      const result = await tenancy.resolve();
      expect(result.activeStore.id).toBe("store-1");
    });

    it("throws when user has no membership", async () => {
      const tenancy = new Tenancy(mockSupabase({ membership: null }));

      await expect(tenancy.resolve()).rejects.toThrow(TenancyError);
      await expect(tenancy.resolve()).rejects.toThrow(
        "No organization membership found for user",
      );
    });

    it("throws when organization has no stores", async () => {
      const tenancy = new Tenancy(mockSupabase({ stores: [] }));

      await expect(tenancy.resolve()).rejects.toThrow(
        "No stores connected for organization",
      );
    });
  });

  describe("getStoreScope", () => {
    it("returns scope for resolved active store", async () => {
      const tenancy = new Tenancy(mockSupabase({}));
      const scope = await tenancy.getStoreScope();

      expect(scope).toEqual({ organizationId: "org-1", storeId: "store-1" });
    });

    it("returns scope for explicit store id", async () => {
      const tenancy = new Tenancy(
        mockSupabase({
          stores: [
            {
              id: "store-1",
              label: "Main",
              platform: "mock_csv",
              status: "connected",
            },
            {
              id: "store-2",
              label: "EU",
              platform: "shopify",
              status: "connected",
            },
          ],
        }),
      );

      const scope = await tenancy.getStoreScope({ storeId: "store-2" });
      expect(scope).toEqual({ organizationId: "org-1", storeId: "store-2" });
    });

    it("throws when no stores exist", async () => {
      const tenancy = new Tenancy(mockSupabase({ stores: [] }));

      await expect(tenancy.getStoreScope()).rejects.toThrow(TenancyError);
    });
  });

  describe("setActiveStore", () => {
    it("updates active store and returns refreshed tenancy", async () => {
      const tenancy = new Tenancy(
        mockSupabaseWithMutableOrg({
          organization: { id: "org-1", name: "Acme", active_store_id: null },
          stores: [
            {
              id: "store-1",
              label: "Main",
              platform: "mock_csv",
              status: "connected",
            },
            {
              id: "store-2",
              label: "EU",
              platform: "shopify",
              status: "connected",
            },
          ],
        }),
      );

      const result = await tenancy.setActiveStore({ storeId: "store-2" });
      expect(result.activeStore.id).toBe("store-2");
    });

    it("throws when store does not belong to organization", async () => {
      const tenancy = new Tenancy(mockSupabase({}));

      await expect(
        tenancy.setActiveStore({ storeId: "missing-store" }),
      ).rejects.toThrow("Store not found in organization");
    });
  });
});
