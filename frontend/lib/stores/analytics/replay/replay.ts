import type { SupabaseClient } from "@supabase/supabase-js";
import { detectBreaches } from "@/lib/detection/detect";
import { detectForecastRisks } from "@/lib/detection/forecast";

import { readReplayCursor, writeReplayCursor } from "./cursor";
import {
  advanceReplayCursor,
  dataEndDate,
  REPLAY_START,
  streamStartDate,
  streamStartFromEnd,
} from "./replay-bounds";
import type { ReplayOpts } from "./replay-request";
import type { ReplayResult } from "./replay-result";

const DEFAULT_ADVANCE_DAYS = 7;

// BYOD Phase 3 — the replay clock (RUN-82).
//
// Advance a cursor through the uploaded history; at each step run detection
// anchored *as of* the cursor so incidents open at the point in history where
// a product first crosses its learned threshold. Detection dedupes against open
// incidents, so re-runs are idempotent.

export async function runReplay(
  supabase: SupabaseClient,
  opts: ReplayOpts,
): Promise<ReplayResult> {
  const advance = opts.advanceDays ?? DEFAULT_ADVANCE_DAYS;

  const end = await dataEndDate(supabase, opts.organizationId);
  const start = streamStartFromEnd(end);
  const previous = (await readReplayCursor(supabase, opts.organizationId)) ?? start;

  const { cursor, at_end } = advanceReplayCursor({
    previous,
    advanceDays: advance,
    end,
  });

  await writeReplayCursor(supabase, opts.organizationId, cursor);

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
    at_end,
    breaches,
    forecast,
  };
}

// Reset the replay clock to the start of the live window (for re-running the demo,
// and after connect so the board starts empty).
export async function resetReplay(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<{ cursor: string }> {
  const cursor = (await streamStartDate(supabase, organizationId)) ?? REPLAY_START;
  await writeReplayCursor(supabase, organizationId, cursor);
  return { cursor };
}
