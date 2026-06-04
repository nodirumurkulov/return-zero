#!/usr/bin/env node
/**
 * validate-counts.mjs — assert imported row counts match the data pack.
 *
 * Fails (exit 1) on any mismatch. Run after seeding against a real Supabase project.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run validate:counts
 */
import { createScriptClient } from "./lib/supabase.mjs";

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

const supabase = createScriptClient();
const failures = [];

for (const [table, expected] of Object.entries(EXPECTED)) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ERROR ${table}: ${error.message}`);
    failures.push(table);
    continue;
  }
  const ok = count === expected;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${table.padEnd(20)} ${count}${ok ? "" : `  (expected ${expected})`}`);
  if (!ok) failures.push(table);
}

console.log(failures.length === 0 ? "\nAll row counts match ✓" : `\n${failures.length} table(s) mismatched`);
process.exit(failures.length === 0 ? 0 : 1);
