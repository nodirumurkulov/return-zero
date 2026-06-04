import type { SupabaseClient } from "@supabase/supabase-js";
import { detectBreaches, type DetectionResult } from "./detect";
import { detectForecastRisks, type ForecastDetectionResult } from "./forecast";

// BYOD Phase 3 — the replay clock (RUN-82).
//
// Advance a cursor through the uploaded history; at each step run the SAME
// detectors as live operation, but anchored *as of* the cursor, so incidents
// open at the point in history where a product first crosses its (learned)
// threshold — the "alert before the loss" moment, streaming onto the Kanban.
// Detection is deduped against open incidents, so re-runs are idempotent.

const DEFAULT_START = "2025-12-01"; // BASELINE_END — replay streams the post-baseline window
const DEFAULT_ADVANCE_DAYS = 7;

function asDate(value: string): string {
  return value.slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Latest order date in the data — the replay never advances past it.
async function dataEndDate(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("orders")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? asDate(String(data.created_at)) : null;
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

  const { data: stateRow } = await supabase
    .from("replay_state")
    .select("cursor")
    .eq("id", true)
    .maybeSingle();
  const previous = stateRow?.cursor ? asDate(String(stateRow.cursor)) : DEFAULT_START;

  const end = await dataEndDate(supabase);
  const advanced = addDays(previous, advance);
  const cursor = end && advanced > end ? end : advanced;

  const { error: upErr } = await supabase
    .from("replay_state")
    .upsert({ id: true, cursor }, { onConflict: "id" });
  if (upErr) throw new Error(`replay_state upsert failed: ${upErr.message}`);

  // Same detectors as live, anchored to the cursor. Both dedup against open incidents.
  const breaches = await detectBreaches(supabase, { asOf: cursor });
  const forecast = await detectForecastRisks(supabase, { asOf: cursor });

  return {
    previous_cursor: previous,
    cursor,
    at_end: Boolean(end) && cursor >= end!,
    breaches,
    forecast,
  };
}

// Reset the replay clock back to the start (for re-running the demo).
export async function resetReplay(supabase: SupabaseClient): Promise<{ cursor: string }> {
  const { error } = await supabase
    .from("replay_state")
    .upsert({ id: true, cursor: DEFAULT_START }, { onConflict: "id" });
  if (error) throw new Error(`replay_state reset failed: ${error.message}`);
  return { cursor: DEFAULT_START };
}
