#!/usr/bin/env node
/**
 * check-metrics.mjs — metrics/series sanity validation on the seeded fixture.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run validate:metrics
 */
import { createScriptClient } from "./lib/supabase.mjs";

const supabase = createScriptClient();
const failures = [];
const check = (name, cond, detail) => {
  if (cond) console.log(`  ok   ${name}`);
  else {
    console.log(`  FAIL ${name} — ${detail}`);
    failures.push(name);
  }
};

async function fetchAllMonthlySeries() {
  const pageSize = 1000;
  const loadPage = async (from, acc) => {
    const { data, error } = await supabase
      .rpc("product_monthly_series", { p_months: 24 })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const merged = acc.concat(data);
    if (data.length < pageSize) return merged;
    return loadPage(from + pageSize, merged);
  };
  return loadPage(0, []);
}

const { data: facts, error: fErr } = await supabase.rpc("product_source_facts", { p_window_days: 30 });
if (fErr) {
  console.error(fErr.message);
  process.exit(1);
}
check("product_source_facts returns all products", facts.length === 62, `got ${facts.length}`);

const ct = facts.find((r) => r.product_id === "prod_00005");
check("Court Trainer present", !!ct, "prod_00005 missing");
if (ct) {
  const refundRate = Number(ct.refunds_amount) / Number(ct.sales_revenue || 1);
  check(
    "Court Trainer refund_rate in sane range (0.05–0.6)",
    refundRate > 0.05 && refundRate < 0.6,
    refundRate.toFixed(3),
  );
  check("Court Trainer has sales", Number(ct.sales_revenue) > 0, `${ct.sales_revenue}`);
}

const series = await fetchAllMonthlySeries();
check("monthly series is 62 x 24", series.length === 62 * 24, `got ${series.length}`);
const ctMonths = series.filter((r) => r.product_id === "prod_00005");
check("Court Trainer has 24 monthly points", ctMonths.length === 24, `got ${ctMonths.length}`);
check("Court Trainer monthly units are non-negative", ctMonths.every((r) => Number(r.units) >= 0), "negative units");

console.log(failures.length === 0 ? "\nALL CHECKS PASSED" : `\n${failures.length} CHECK(S) FAILED`);
process.exit(failures.length === 0 ? 0 : 1);
