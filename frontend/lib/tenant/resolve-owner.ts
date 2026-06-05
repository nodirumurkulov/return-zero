import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveOwnerUserId(
  supabase: SupabaseClient,
  explicit?: string,
): Promise<string> {
  if (explicit) return explicit;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("owner user required");
  return user.id;
}
