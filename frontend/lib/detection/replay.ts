import type { SupabaseClient } from "@supabase/supabase-js";
import { detectBreaches, type DetectionResult } from "./detect";
import { detectForecastRisks, type ForecastDetectionResult } from "./forecast";
import { asDate, REPLAY_START, streamEndDate, streamStartDate } from "./replay-clock";

// The detector-coupled replay step. Each call ingests the day's newly-"arrived"
// staging rows into the live tables, THEN runs the same detectors as of the
// cursor — so incidents emerge from real data. Imports ./detect + ./forecast
// (which pull in lib/slack, `server-only`), so keep this out of Bun scripts; the
// pure clock primitives live in ./replay-clock.

const DEFAULT_ADVANCE_DAYS = 7;

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
