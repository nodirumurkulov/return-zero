import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { getCurrentOrganizationId, tryRequireOrganizationId } from "./queries";

function mockSupabase(membership: { organization_id: string } | null, userId = "user-1") {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: userId } } }),
    },
    from: (table: string) => {
      if (table !== "organization_members") throw new Error(`unexpected table ${table}`);
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: membership, error: null }),
              }),
            }),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient<Database>;
}

describe("getCurrentOrganizationId", () => {
  it("returns membership organization id", async () => {
    const orgId = await getCurrentOrganizationId(
      mockSupabase({ organization_id: "org-1" }),
    );
    expect(orgId).toBe("org-1");
  });

  it("returns null when user has no membership", async () => {
    const orgId = await getCurrentOrganizationId(mockSupabase(null));
    expect(orgId).toBeNull();
  });
});

describe("tryRequireOrganizationId", () => {
  it("returns ok result with organization id", async () => {
    const result = await tryRequireOrganizationId(
      mockSupabase({ organization_id: "org-1" }),
    );
    expect(result).toEqual({ ok: true, organizationId: "org-1" });
  });

  it("returns error when membership missing", async () => {
    const result = await tryRequireOrganizationId(mockSupabase(null));
    expect(result.ok).toBe(false);
  });
});
