/**
 * Assert imported row counts match the Pretty Fly data pack after staging.
 *
 *   bun run scripts/validate-counts.ts
 */
import { createClient } from "@supabase/supabase-js";

import { STREAM_CUTOFF } from "../lib/detection/stream-stage";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

/** Live history counts after stage_future_stream (full dataset minus future window). */
const EXPECTED_LIVE: Record<string, number> = {
  products: 62,
  variants: 645,
  customers: 22440,
  orders: 35892,
  line_items: 49876,
  refunds: 3976,
  collections: 9,
  meta_ads_daily: 2192,
  google_ads_daily: 3836,
  inventory_movements: 54334,
  support_tickets: 1204,
  purchase_orders: 21,
  po_line_items: 645,
};

const EXPECTED_STREAM: Record<string, number> = {
  orders_stream: 13901,
  line_items_stream: 20080,
  refunds_stream: 1867,
  inventory_movements_stream: 22110,
  meta_ads_daily_stream: 910,
  google_ads_daily_stream: 1274,
};

const supabase = createClient(url, key);
const failures: string[] = [];

for (const [table, expected] of Object.entries(EXPECTED_LIVE)) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ERROR ${table}: ${error.message}`);
    failures.push(table);
    continue;
  }
  const ok = count === expected;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${table.padEnd(24)} ${count}${ok ? "" : `  (expected ${expected})`}`,
  );
  if (!ok) failures.push(table);
}

for (const [table, expected] of Object.entries(EXPECTED_STREAM)) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ERROR ${table}: ${error.message}`);
    failures.push(table);
    continue;
  }
  const ok = count === expected;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${table.padEnd(24)} ${count}${ok ? "" : `  (expected ${expected})`}`,
  );
  if (!ok) failures.push(table);
}

const { data: liveMaxRow } = await supabase
  .from("orders")
  .select("created_at")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
const liveMax = liveMaxRow?.created_at ? String(liveMaxRow.created_at).slice(0, 10) : null;
const liveMaxOk = liveMax != null && liveMax <= STREAM_CUTOFF;
console.log(
  `  ${liveMaxOk ? "ok  " : "FAIL"} live orders max date     ${liveMax ?? "null"}${liveMaxOk ? "" : `  (expected ≤ ${STREAM_CUTOFF})`}`,
);
if (!liveMaxOk) failures.push("orders_max_date");

const { data: streamMinRow } = await supabase
  .from("orders_stream")
  .select("created_at")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
const streamMin = streamMinRow?.created_at ? String(streamMinRow.created_at).slice(0, 10) : null;
const streamMinOk = streamMin != null && streamMin > STREAM_CUTOFF;
console.log(
  `  ${streamMinOk ? "ok  " : "FAIL"} stream orders min date  ${streamMin ?? "null"}${streamMinOk ? "" : `  (expected > ${STREAM_CUTOFF})`}`,
);
if (!streamMinOk) failures.push("orders_stream_min_date");

const { data: streamCustomerRows, error: streamCustErr } = await supabase
  .from("orders_stream")
  .select("customer_id")
  .not("customer_id", "is", null);
if (streamCustErr) {
  console.log(`  ERROR stream customer FK: ${streamCustErr.message}`);
  failures.push("stream_customer_fk");
} else {
  try {
    const streamCustomerIds = [
      ...new Set((streamCustomerRows ?? []).map((r) => String(r.customer_id))),
    ];
    const BATCH = 500;
    const batches = Array.from(
      { length: Math.ceil(streamCustomerIds.length / BATCH) },
      (_, i) => streamCustomerIds.slice(i * BATCH, i * BATCH + BATCH),
    );
    const missing = (
      await Promise.all(
        batches.map(async (batch) => {
          const { data: found, error: custErr } = await supabase
            .from("customers")
            .select("customer_id")
            .in("customer_id", batch);
          if (custErr) throw custErr;
          const foundSet = new Set((found ?? []).map((r) => String(r.customer_id)));
          return batch.filter((id) => !foundSet.has(id));
        }),
      )
    ).flat();
    const fkOk = missing.length === 0;
    console.log(
      `  ${fkOk ? "ok  " : "FAIL"} stream customer FK       ${missing.length} orphans${fkOk ? "" : "  (expected 0)"}`,
    );
    if (!fkOk) failures.push("stream_customer_fk");
  } catch (err) {
    const message = err instanceof Error ? err.message : "stream customer FK check failed";
    console.log(`  ERROR stream customer FK: ${message}`);
    failures.push("stream_customer_fk");
  }
}

console.log(
  failures.length === 0 ? "\nAll row counts match ✓" : `\n${failures.length} check(s) failed`,
);
process.exit(failures.length === 0 ? 0 : 1);
