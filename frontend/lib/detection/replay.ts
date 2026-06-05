import type { SupabaseClient } from "@supabase/supabase-js";
import { detectBreaches, type DetectionResult } from "./detect";
import { detectForecastRisks, type ForecastDetectionResult } from "./forecast";

// BYOD — the replay clock with real ingest (RUN-82 / RUN-87).
//
// The client uploads their HISTORY (≤ cutoff) into the live tables; the FUTURE
// rows wait in *_stream staging tables. "Now" starts at the history end and walks
// forward: each step ingests that day's staging rows into the live tables (orders
// genuinely arrive), THEN runs the same detectors as of the cursor — so incidents
// emerge from newly-arrived data. Deduped against open incidents (idempotent).

export const REPLAY_START = "2025-12-01"; // fallback only when there is no data
const DEFAULT_ADVANCE_DAYS = 7;

function asDate(value: string): string {
  return value.slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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

export interface ReplayResult {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
  forecast: ForecastDetectionResult;
}

export async function runReplay(
  supabase: SupabaseClient,
  opts: { advanceDays?: number } = {},
): Promise<ReplayResult> {
  const advance = opts.advanceDays ?? DEFAULT_ADVANCE_DAYS;

  const start = (await streamStartDate(supabase)) ?? REPLAY_START;
  const end = (await streamEndDate(supabase)) ?? start;

  const { data: stateRow } = await supabase
    .from("replay_state")
    .select("cursor")
    .eq("id", true)
    .maybeSingle();
  const previous = stateRow?.cursor ? asDate(String(stateRow.cursor)) : start;

  const advanced = addDays(previous, advance);
  const cursor = advanced > end ? end : advanced;

  const { error: upErr } = await supabase
    .from("replay_state")
    .upsert({ id: true, cursor }, { onConflict: "id" });
  if (upErr) throw new Error(`replay_state upsert failed: ${upErr.message}`);

  // Ingest the newly-"arrived" rows into the live tables, THEN detect as of the cursor.
  const { error: ingErr } = await supabase.rpc("ingest_stream", { p_asof: cursor });
  if (ingErr) throw new Error(`ingest_stream failed: ${ingErr.message}`);

  const breaches = await detectBreaches(supabase, { asOf: cursor });
  const forecast = await detectForecastRisks(supabase, { asOf: cursor });

  return { previous_cursor: previous, cursor, at_end: cursor >= end, breaches, forecast };
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
