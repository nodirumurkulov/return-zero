import type { SupabaseClient } from "@supabase/supabase-js";

function asDate(value: string): string {
  return value.slice(0, 10);
}

export async function readReplayCursor(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("store_connections")
    .select("replay_cursor")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return data?.replay_cursor ? asDate(String(data.replay_cursor)) : null;
}

export async function writeReplayCursor(
  supabase: SupabaseClient,
  organizationId: string,
  cursor: string,
): Promise<void> {
  const { error } = await supabase
    .from("store_connections")
    .update({ replay_cursor: cursor, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId);
  if (error) throw new Error(`store_connections replay_cursor update failed: ${error.message}`);
}
