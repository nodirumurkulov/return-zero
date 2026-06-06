/**
 * Metrics/series sanity validation on the seeded fixture.
 *
 *   bun run scripts/validate-metrics.ts
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient<Database>(url, key);
const failures: string[] = [];

type ProductSourceFact = Database["public"]["Functions"]["product_source_facts"]["Returns"][number];
type MonthlySeriesRow = Database["public"]["Functions"]["product_monthly_series"]["Returns"][number];

const check = (name: string, cond: boolean, detail: string) => {
  if (cond) console.log(`  ok   ${name}`);
  else {
    console.log(`  FAIL ${name} — ${detail}`);
    failures.push(name);
  }
};

const { data: orgRow, error: orgErr } = await supabase
  .from("organizations")
  .select("id")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
if (orgErr || !orgRow?.id) {
  console.error(orgErr?.message ?? "No organization found — seed the database first");
  process.exit(1);
}
const organizationId = orgRow.id;

const { data: courtTrainer, error: ctErr } = await supabase
  .from("products")
  .select("id")
  .eq("organization_id", organizationId)
  .eq("external_id", "prod_00005")
  .maybeSingle();
if (ctErr) {
  console.error(ctErr.message);
  process.exit(1);
}
const courtTrainerId = courtTrainer?.id;

async function fetchAllMonthlySeries(): Promise<MonthlySeriesRow[]> {
  const pageSize = 1000;
  const loadPage = async (from: number, acc: MonthlySeriesRow[]): Promise<MonthlySeriesRow[]> => {
    const { data, error } = await supabase
      .rpc("product_monthly_series", {
        p_organization_id: organizationId,
        p_months: 24,
      })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = data ?? [];
    const merged = acc.concat(page);
    if (page.length < pageSize) return merged;
    return loadPage(from + pageSize, merged);
  };
  return loadPage(0, []);
}

const { data: facts, error: fErr } = await supabase.rpc("product_source_facts", {
  p_organization_id: organizationId,
  p_window_days: 30,
});
if (fErr) {
  console.error(fErr.message);
  process.exit(1);
}

const factRows: ProductSourceFact[] = facts ?? [];
check(
  "product_source_facts returns all products",
  factRows.length === 62,
  `got ${factRows.length}`,
);

const ct = courtTrainerId ? factRows.find((r) => r.product_id === courtTrainerId) : undefined;
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
const ctMonths = courtTrainerId
  ? series.filter((r) => r.product_id === courtTrainerId)
  : [];
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
