import type { SupabaseClient } from "@supabase/supabase-js";

/** Distinct tenants that have loaded store data (used by cron schedulers). */
export async function listOwnerUserIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("products").select("owner_user_id");
  if (error) throw new Error(`listOwnerUserIds: ${error.message}`);
  const ids = new Set(
    (data ?? [])
      .map((r) => r.owner_user_id as string | null)
      .filter((id): id is string => id != null && id.length > 0),
  );
  return [...ids];
}
