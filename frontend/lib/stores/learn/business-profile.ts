import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/** Seed business_profile from connected store data when onboarding form was removed. */
export async function seedBusinessProfileFromStore(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const [{ data: org }, { data: topProducts }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
    supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .order("title", { ascending: true })
      .limit(3),
  ]);

  const { error } = await supabase.from("business_profile").upsert({
    organization_id: organizationId,
    platform: "mock_csv",
    store_name: org?.name ?? "Demo store",
    primary_goal: "growth",
    hero_product_ids: (topProducts ?? []).map((row) => row.id),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`business_profile upsert failed: ${error.message}`);
  }
}
