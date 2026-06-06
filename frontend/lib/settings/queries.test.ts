import { describe, expect, it } from "vitest";
import { HUGO_MOCK_STORE_NAME } from "@/lib/organizations/mock-store";
import { loadBusinessProfile } from "./queries";

function asThenable<T>(data: T) {
  return {
    then: (onFulfilled: (value: { data: T; error: null }) => void) => {
      onFulfilled({ data, error: null });
    },
  };
}

function createMockSupabase(rows: {
  profile?: Record<string, unknown> | null;
  settings?: { key: string; value: number }[];
}) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          if (table === "business_profile") {
            return {
              maybeSingle: () => Promise.resolve({ data: rows.profile ?? null, error: null }),
            };
          }
          if (table === "business_settings") {
            return asThenable(rows.settings ?? []);
          }
          return asThenable([]);
        },
      }),
    }),
  } as never;
}

describe("loadBusinessProfile", () => {
  it("returns defaults when no profile row exists", async () => {
    const supabase = createMockSupabase({ profile: null, settings: [] });
    const profile = await loadBusinessProfile(supabase, "org-1");
    expect(profile.platform).toBe("shopify");
    expect(profile.storeName).toBe("");
    expect(profile.targetMarginPct).toBeCloseTo(55);
  });

  it("maps stored profile fields", async () => {
    const supabase = createMockSupabase({
      profile: {
        platform: "woocommerce",
        store_name: HUGO_MOCK_STORE_NAME,
        primary_goal: "margin",
        hero_product_ids: ["p1"],
      },
      settings: [{ key: "min_roas", value: 4 }],
    });
    const profile = await loadBusinessProfile(supabase, "org-1");
    expect(profile.platform).toBe("woocommerce");
    expect(profile.storeName).toBe(HUGO_MOCK_STORE_NAME);
    expect(profile.primaryGoal).toBe("margin");
    expect(profile.minRoas).toBe(4);
    expect(profile.heroProductIds).toEqual(["p1"]);
  });
});
