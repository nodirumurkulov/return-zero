/**
 * Metrics/series sanity validation on the seeded fixture.
 *
 *   bun --env-file=.env.local run scripts/validate-metrics.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const failures: string[] = [];

const check = (name: string, cond: boolean, detail: string) => {
  if (cond) console.log(`  ok   ${name}`);
  else {
    console.log(`  FAIL ${name} — ${detail}`);
    failures.push(name);
  }
};

async function fetchAllMonthlySeries(): Promise<
  { product_id: string; units: number }[]
> {
  const pageSize = 1000;
  const loadPage = async (
    from: number,
    acc: { product_id: string; units: number }[],
  ): Promise<{ product_id: string; units: number }[]> => {
    const { data, error } = await supabase
      .rpc("product_monthly_series", { p_months: 24 })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as { product_id: string; units: number }[];
    const merged = acc.concat(page);
    if (page.length < pageSize) return merged;
    return loadPage(from + pageSize, merged);
  };
  return loadPage(0, []);
}

const { data: facts, error: fErr } = await supabase.rpc("product_source_facts", {
  p_window_days: 30,
});
if (fErr) {
  console.error(fErr.message);
  process.exit(1);
}

const factRows = facts ?? [];
check(
  "product_source_facts returns all products",
  factRows.length === 62,
  `got ${factRows.length}`,
);

const ct = factRows.find(
  (r: { product_id: string }) => r.product_id === "prod_00005",
);
check("Court Trainer present", !!ct, "prod_00005 missing");
if (ct) {
  const row = ct as {
    product_id: string;
    refunds_amount: number;
    sales_revenue: number;
  };
  const refundRate = Number(row.refunds_amount) / Number(row.sales_revenue || 1);
  check(
    "Court Trainer refund_rate in sane range (0.05–0.6)",
    refundRate > 0.05 && refundRate < 0.6,
    refundRate.toFixed(3),
  );
  check("Court Trainer has sales", Number(row.sales_revenue) > 0, `${row.sales_revenue}`);
}

const series = await fetchAllMonthlySeries();
check("monthly series is 62 x 24", series.length === 62 * 24, `got ${series.length}`);
const ctMonths = series.filter((r) => r.product_id === "prod_00005");
check("Court Trainer has 24 monthly points", ctMonths.length === 24, `got ${ctMonths.length}`);
check(
  "Court Trainer monthly units are non-negative",
  ctMonths.every((r) => Number(r.units) >= 0),
  "negative units",
);

console.log(
  failures.length === 0 ? "\nALL CHECKS PASSED" : `\n${failures.length} CHECK(S) FAILED`,
);
process.exit(failures.length === 0 ? 0 : 1);
