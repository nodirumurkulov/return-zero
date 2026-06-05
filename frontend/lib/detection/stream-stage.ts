import type { SupabaseClient } from "@supabase/supabase-js";

/** History ends here; rows after this date live in *_stream until replay ingests them. */
export const STREAM_CUTOFF = "2025-11-30";

/** Move future rows from live tables into *_stream staging (idempotent). */
export async function stageFutureStream(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("stage_future_stream", { p_cutoff: STREAM_CUTOFF });
  if (error) throw new Error(`stage_future_stream failed: ${error.message}`);
}
