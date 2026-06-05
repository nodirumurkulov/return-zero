import type { SupabaseClient } from "@supabase/supabase-js";

// BYOD replay clock — pure stream staging + cursor state (RUN-82 / RUN-109).
//
// The client uploads their HISTORY (≤ cutoff) into the live tables; the FUTURE
// rows wait in *_stream staging tables. "Now" starts at the history end and walks
// forward as `runReplay` (see ./replay) ingests each day's staging rows.
//
// These helpers only read/write the clock and call staging RPCs — they do NOT
// run the detectors, so they stay free of `server-only` (lib/slack) and are
// safe to import from Bun scripts and onboarding/learn paths.

export const REPLAY_START = "2025-12-01"; // fallback only when there is no data
/** History ends here; rows after this date live in *_stream until replay ingests them. */
export const STREAM_CUTOFF = "2025-11-30";

export function asDate(value: string): string {
  return value.slice(0, 10);
}

/** Move future rows from live tables into *_stream staging (idempotent). */
export async function stageFutureStream(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc("stage_future_stream", { p_cutoff: STREAM_CUTOFF });
  if (error) throw new Error(`stage_future_stream failed: ${error.message}`);
}

// Latest order date currently in the LIVE tables (the history end before any
// stream ingest; grows as the stream plays).
export async function dataEndDate(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("orders")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? asDate(String(data.created_at)) : null;
}

// The fixed start of the live window — the history end, stored at learn time.
// Falls back to the current live end (before it's been initialised).
export async function streamStartDate(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("replay_state")
    .select("stream_start")
    .eq("id", true)
    .maybeSingle();
  if (data?.stream_start) return asDate(String(data.stream_start));
  return dataEndDate(supabase);
}

// The last day there is anything to stream (max date across the staging tables).
export async function streamEndDate(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.rpc("stream_end_date");
  return data ? asDate(String(data)) : null;
}

// Initialise the clock right after a fresh upload + learn: fix the stream start
// at the history end and seat the cursor there (board empty until Start).
export async function initReplay(supabase: SupabaseClient): Promise<{ cursor: string }> {
  const start = (await dataEndDate(supabase)) ?? REPLAY_START;
  const { error } = await supabase
    .from("replay_state")
    .upsert({ id: true, cursor: start, stream_start: start }, { onConflict: "id" });
  if (error) throw new Error(`replay_state init failed: ${error.message}`);
  return { cursor: start };
}

// Rewind to the history end for a re-run: remove ingested future rows + the
// incidents opened during the stream, and seat the cursor back at the start.
export async function resetReplay(supabase: SupabaseClient): Promise<{ cursor: string }> {
  const { data } = await supabase
    .from("replay_state")
    .select("stream_start")
    .eq("id", true)
    .maybeSingle();
  const start = (data?.stream_start ? asDate(String(data.stream_start)) : await dataEndDate(supabase)) ?? REPLAY_START;

  const { error: rErr } = await supabase.rpc("reset_stream", { p_stream_start: start });
  if (rErr) throw new Error(`reset_stream failed: ${rErr.message}`);

  const { error } = await supabase
    .from("replay_state")
    .upsert({ id: true, cursor: start, stream_start: start }, { onConflict: "id" });
  if (error) throw new Error(`replay_state reset failed: ${error.message}`);
  return { cursor: start };
}
