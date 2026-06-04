#!/usr/bin/env node
/**
 * validate-counts.mjs — RUN-5: assert imported row counts match the data pack.
 *
 * Fails (exit 1) on any mismatch so it can gate CI on a fresh seed.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/validate-counts.mjs
 */
import { createClient } from "@supabase/supabase-js";

// Expected row counts for the full Pretty Fly data pack (data/README.md).
const EXPECTED = {
  products: 62,
  variants: 645,
  customers: 22440,
  orders: 49793,
  line_items: 69956,
  refunds: 5843,
  collections: 9,
  meta_ads_daily: 3102,
  google_ads_daily: 5110,
  inventory_movements: 76444,
  support_tickets: 1204,
  purchase_orders: 21,
  po_line_items: 645,
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

let failures = 0;
for (const [table, expected] of Object.entries(EXPECTED)) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ERROR ${table}: ${error.message}`);
    failures++;
    continue;
  }
  const ok = count === expected;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${table.padEnd(20)} ${count}${ok ? "" : `  (expected ${expected})`}`);
  if (!ok) failures++;
}

console.log(failures === 0 ? "\nAll row counts match ✓" : `\n${failures} table(s) mismatched`);
process.exit(failures === 0 ? 0 : 1);
