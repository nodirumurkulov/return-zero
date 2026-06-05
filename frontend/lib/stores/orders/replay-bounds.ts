import type { SupabaseClient } from "@supabase/supabase-js";

// The live window = the last STREAM_WINDOW_MONTHS of the uploaded data. The agent
// learns the baseline on everything before it, then streams/detects this window.
// REPLAY_START is only a fallback for data with no orders.
export const REPLAY_START = "2025-12-01";
const STREAM_WINDOW_MONTHS = 3;

function asDate(value: string): string {
  return value.slice(0, 10);
}

export function addDays(iso: string, days: number): string {
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

export function streamStartFromEnd(end: string | null): string {
  return end ? minusMonths(end, STREAM_WINDOW_MONTHS) : REPLAY_START;
}

export function advanceReplayCursor(opts: {
  previous: string;
  advanceDays: number;
  end: string | null;
}): { cursor: string; at_end: boolean } {
  const advanced = addDays(opts.previous, opts.advanceDays);
  const cursor = opts.end && advanced > opts.end ? opts.end : advanced;
  return {
    cursor,
    at_end: Boolean(opts.end) && cursor >= opts.end!,
  };
}
