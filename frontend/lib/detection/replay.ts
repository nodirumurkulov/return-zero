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

// The live window = the last STREAM_WINDOW_MONTHS of the uploaded data. The agent
// learns the baseline on everything before it, then streams/detects this window.
// REPLAY_START is only a fallback for data with no orders.
export const REPLAY_START = "2025-12-01";
const STREAM_WINDOW_MONTHS = 3;
const DEFAULT_ADVANCE_DAYS = 7;

function asDate(value: string): string {
  return value.slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function minusMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

// Latest order date in the data — the replay never advances past it.
export async function dataEndDate(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("orders")
    .select("created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? asDate(String(data.created_at)) : null;
}

// Where the live stream begins: STREAM_WINDOW_MONTHS before the last order.
// Null only when there are no orders (caller falls back to REPLAY_START).
export async function streamStartDate(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const end = await dataEndDate(supabase, organizationId);
  return end ? minusMonths(end, STREAM_WINDOW_MONTHS) : null;
}

export interface ReplayResult {
  previous_cursor: string;
  cursor: string;
  at_end: boolean;
  breaches: DetectionResult;
  forecast: ForecastDetectionResult;
}

export interface ReplayOpts {
  organizationId: string;
  advanceDays?: number;
}

export async function runReplay(
  supabase: SupabaseClient,
  opts: ReplayOpts,
): Promise<ReplayResult> {
  const advance = opts.advanceDays ?? DEFAULT_ADVANCE_DAYS;

  const end = await dataEndDate(supabase, opts.organizationId);
  const start = end ? minusMonths(end, STREAM_WINDOW_MONTHS) : REPLAY_START;

  const { data: stateRow } = await supabase
    .from("store_connections")
    .select("replay_cursor")
    .eq("organization_id", opts.organizationId)
    .maybeSingle();
  const previous = stateRow?.replay_cursor ? asDate(String(stateRow.replay_cursor)) : start;

  const advanced = addDays(previous, advance);
  const cursor = end && advanced > end ? end : advanced;

  const { error: upErr } = await supabase
    .from("store_connections")
    .update({ replay_cursor: cursor, updated_at: new Date().toISOString() })
    .eq("organization_id", opts.organizationId);
  if (upErr) throw new Error(`store_connections replay_cursor update failed: ${upErr.message}`);

  // Same detectors as live, anchored to the cursor. Both dedup against open incidents.
  const breaches = await detectBreaches(supabase, {
    organizationId: opts.organizationId,
    asOf: cursor,
  });
  const forecast = await detectForecastRisks(supabase, {
    organizationId: opts.organizationId,
    asOf: cursor,
  });

  return {
    previous_cursor: previous,
    cursor,
    at_end: Boolean(end) && cursor >= end!,
    breaches,
    forecast,
  };
}

// Reset the replay clock to the start of the live window (for re-running the demo,
// and seeded right after an upload so the board starts empty).
export async function resetReplay(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<{ cursor: string }> {
  const cursor = (await streamStartDate(supabase, organizationId)) ?? REPLAY_START;
  const { error } = await supabase
    .from("store_connections")
    .update({ replay_cursor: cursor, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId);
  if (error) throw new Error(`store_connections replay_cursor reset failed: ${error.message}`);
  return { cursor };
}
