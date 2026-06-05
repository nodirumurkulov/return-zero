// BYOD Phase 2 — business report after upload (RUN-81).
//
// Right after a client uploads their data and we learn their baselines, show a
// readable "here's your business + the patterns we noticed" report — the visible
// face of the knowledge base.
//
// The numbers are computed deterministically from the engine; the LLM only
// NARRATES over them (never invents figures). If no LLM key is configured the
// report still renders with a deterministic narrative.

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { callLLMJson } from "@/lib/llm";
import { computeMetricsDetailed } from "@/lib/metrics/engine";
import { getMonthlySeries } from "@/lib/metrics/series";
import type { MetricValue, MonthlyPoint } from "@/lib/metrics/types";

export interface TopProduct {
  product_id: string;
  title: string;
  value: number;
}

export interface RiskNow {
  product_id: string;
  title: string;
  metric_key: string;
  display_name: string;
  value: number | null;
  threshold: number;
  severity: string;
}

export interface LearnedPattern {
  metric_key: string;
  display_name: string;
  avg_mean: number;
  avg_threshold: number;
  products: number;
}

export interface ReportSummary {
  generated_window_days: number;
  totals: {
    revenue_lifetime: number;
    orders: number;
    aov: number;
    refund_rate: number;
    return_rate: number;
    support_volume: number;
    products: number;
    skus: number;
    breaches_now: number;
  };
  trend: {
    months: string[];
    revenue: number[];
    refund_rate: number[];
    revenue_direction: "rising" | "falling" | "stable";
    peak_revenue_month: string | null;
  };
  top: {
    by_revenue: TopProduct[];
    worst_refund_rate: TopProduct[];
    worst_roas: TopProduct[];
  };
  risks_now: RiskNow[];
  learned: LearnedPattern[];
}

const round = (n: number, dp = 2): number => Number(n.toFixed(dp));
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]): number => (xs.length ? sum(xs) / xs.length : 0);

async function headCount(supabase: SupabaseClient, table: string): Promise<number> {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

// Aggregate per-product monthly points into store-wide monthly totals.
function monthlyTotals(seriesByProduct: Map<string, MonthlyPoint[]>) {
  const all = Array.from(seriesByProduct.values()).flat();
  const byMonth = all.reduce<Record<string, { revenue: number; refund_amount: number; units: number; refund_count: number }>>(
    (acc, p) => {
      const cur = acc[p.month] ?? { revenue: 0, refund_amount: 0, units: 0, refund_count: 0 };
      acc[p.month] = {
        revenue: cur.revenue + p.revenue,
        refund_amount: cur.refund_amount + p.refund_amount,
        units: cur.units + p.units,
        refund_count: cur.refund_count + p.refund_count,
      };
      return acc;
    },
    {},
  );
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, t]) => ({
      month,
      revenue: t.revenue,
      refund_rate: t.revenue > 0 ? t.refund_amount / t.revenue : 0,
    }));
}

function trendDirection(values: number[]): "rising" | "falling" | "stable" {
  if (values.length < 4) return "stable";
  const head = mean(values.slice(0, 3));
  const tail = mean(values.slice(-3));
  if (tail > head * 1.05) return "rising";
  if (tail < head * 0.95) return "falling";
  return "stable";
}

function metricValue(metrics: MetricValue[], key: string): MetricValue | undefined {
  return metrics.find((m) => m.metric_key === key);
}

export async function buildSummary(supabase: SupabaseClient): Promise<ReportSummary> {
  const [{ metrics }, seriesByProduct, productRows, baselineRows, thresholdRows, orders, support, skus] =
    await Promise.all([
      computeMetricsDetailed(supabase),
      getMonthlySeries(supabase, { months: 24 }),
      supabase.from("products").select("product_id, title"),
      supabase.from("product_baselines").select("metric_key, mean"),
      supabase.from("product_kpi_thresholds").select("metric_key, threshold").not("product_id", "is", null),
      headCount(supabase, "orders"),
      headCount(supabase, "support_tickets"),
      headCount(supabase, "variants"),
    ]);

  const titleOf = new Map<string, string>(
    (productRows.data ?? []).map((p) => [String(p.product_id), String(p.title ?? p.product_id)]),
  );
  const displayName = new Map<string, string>();
  for (const list of Object.values(metrics)) {
    for (const m of list) displayName.set(m.metric_key, m.display_name);
  }

  // ---- lifetime totals from the full monthly series -------------------------
  const allPoints = Array.from(seriesByProduct.values()).flat();
  const revenueLifetime = sum(allPoints.map((p) => p.revenue));
  const refundAmount = sum(allPoints.map((p) => p.refund_amount));
  const units = sum(allPoints.map((p) => p.units));
  const refundCount = sum(allPoints.map((p) => p.refund_count));

  // ---- trend ----------------------------------------------------------------
  const totals = monthlyTotals(seriesByProduct);
  const revenueByMonth = totals.map((t) => t.revenue);
  const peak = totals.reduce<{ month: string; revenue: number } | null>(
    (best, t) => (best && best.revenue >= t.revenue ? best : { month: t.month, revenue: t.revenue }),
    null,
  );

  // ---- top / bottom products ------------------------------------------------
  const revenueByProduct = Array.from(seriesByProduct.entries())
    .map(([id, series]) => ({ product_id: id, title: titleOf.get(id) ?? id, value: round(sum(series.map((p) => p.revenue))) }))
    .sort((a, b) => b.value - a.value);

  const productMetrics = Object.entries(metrics);
  const pick = (key: string, dir: "desc" | "asc"): TopProduct[] =>
    productMetrics
      .map(([id, list]) => ({ id, mv: metricValue(list, key) }))
      .filter((x): x is { id: string; mv: MetricValue } => x.mv?.value != null)
      .sort((a, b) => (dir === "desc" ? b.mv.value! - a.mv.value! : a.mv.value! - b.mv.value!))
      .slice(0, 5)
      .map((x) => ({ product_id: x.id, title: titleOf.get(x.id) ?? x.id, value: round(x.mv.value!, 3) }));

  // ---- current breaches (read-only; no incidents opened) --------------------
  const risksNow = productMetrics
    .flatMap(([id, list]) =>
      list
        .filter((m) => m.status === "critical")
        .map((m) => ({
          product_id: id,
          title: titleOf.get(id) ?? id,
          metric_key: m.metric_key,
          display_name: m.display_name,
          value: m.value,
          threshold: m.threshold,
          severity: m.severity,
        })),
    )
    .slice(0, 12);

  // ---- learned patterns (the knowledge base) --------------------------------
  const groupAvg = (rows: { metric_key: string; v: number }[]) =>
    Object.entries(
      rows.reduce<Record<string, number[]>>((acc, r) => {
        (acc[r.metric_key] ??= []).push(r.v);
        return acc;
      }, {}),
    );
  const meanByMetric = new Map(
    groupAvg((baselineRows.data ?? []).map((r) => ({ metric_key: String(r.metric_key), v: Number(r.mean) }))).map(
      ([k, vs]) => [k, vs],
    ),
  );
  const threshByMetric = new Map(
    groupAvg((thresholdRows.data ?? []).map((r) => ({ metric_key: String(r.metric_key), v: Number(r.threshold) }))).map(
      ([k, vs]) => [k, vs],
    ),
  );
  const learned: LearnedPattern[] = Array.from(meanByMetric.entries()).map(([key, means]) => ({
    metric_key: key,
    display_name: displayName.get(key) ?? key,
    avg_mean: round(mean(means), 4),
    avg_threshold: round(mean(threshByMetric.get(key) ?? []), 4),
    products: means.length,
  }));

  return {
    generated_window_days: 30,
    totals: {
      revenue_lifetime: round(revenueLifetime),
      orders,
      aov: round(orders > 0 ? revenueLifetime / orders : 0),
      refund_rate: round(revenueLifetime > 0 ? refundAmount / revenueLifetime : 0, 4),
      return_rate: round(units > 0 ? refundCount / units : 0, 4),
      support_volume: support,
      products: seriesByProduct.size,
      skus,
      breaches_now: risksNow.length,
    },
    trend: {
      months: totals.map((t) => t.month),
      revenue: revenueByMonth.map((v) => round(v)),
      refund_rate: totals.map((t) => round(t.refund_rate, 4)),
      revenue_direction: trendDirection(revenueByMonth),
      peak_revenue_month: peak?.month ?? null,
    },
    top: {
      by_revenue: revenueByProduct.slice(0, 5),
      worst_refund_rate: pick("refund_rate", "desc"),
      worst_roas: pick("ad_roas", "asc"),
    },
    risks_now: risksNow,
    learned,
  };
}

// Deterministic narrative used as the LLM fallback (and as the grounding the LLM
// rewrites). Never contains a figure the summary doesn't already hold.
function fallbackNarrative(s: ReportSummary): string {
  const pct = (n: number) => `${round(n * 100, 1)}%`;
  const trend =
    s.trend.revenue_direction === "rising"
      ? "trending up"
      : s.trend.revenue_direction === "falling"
        ? "trending down"
        : "holding steady";
  const worst = s.top.worst_refund_rate[0];
  return [
    `Across ${s.totals.products} products and ${s.totals.skus} SKUs your store has booked £${s.totals.revenue_lifetime.toLocaleString()} over ${s.trend.months.length} months, with revenue ${trend} and an average order value of £${s.totals.aov.toLocaleString()}.`,
    `Overall refund rate is ${pct(s.totals.refund_rate)} and return rate ${pct(s.totals.return_rate)}.` +
      (worst ? ` ${worst.title} stands out with a ${pct(worst.value)} refund rate.` : ""),
    s.totals.breaches_now > 0
      ? `${s.totals.breaches_now} product${s.totals.breaches_now === 1 ? "" : "s"} are currently outside their learned bands — we'll open incidents and watch these in real time.`
      : `Nothing is currently outside its learned band; we'll keep watching against the baselines we just learned.`,
  ].join(" ");
}

const narrativeLlmSchema = z.object({
  narrative: z.string().optional(),
  text: z.string().optional(),
});

export async function narrate(summary: ReportSummary): Promise<string> {
  const fallback = fallbackNarrative(summary);
  try {
    const result = await callLLMJson(
      [
        {
          role: "system",
          content:
            "You are an analyst writing a short, warm onboarding report for a Shopify merchant. " +
            "Use ONLY the figures in the JSON — never invent numbers. 2-3 short paragraphs of plain prose. " +
            'Reply as JSON: {"narrative": "..."}.',
        },
        {
          role: "user",
          content: `Here is the computed summary of the merchant's business and the patterns we learned:\n${JSON.stringify(summary)}\n\nWrite the narrative.`,
        },
      ],
      narrativeLlmSchema,
    );
    const text = (result?.narrative ?? result?.text ?? "").trim();
    return text.length > 0 ? text : fallback;
  } catch {
    return fallback;
  }
}

export interface BusinessReport {
  id: string;
  summary: ReportSummary;
  narrative: string;
  created_at: string;
}

export async function buildBusinessReport(supabase: SupabaseClient): Promise<BusinessReport> {
  const summary = await buildSummary(supabase);
  const narrative = await narrate(summary);
  const { data, error } = await supabase
    .from("business_reports")
    .insert({ summary, narrative })
    .select("id, summary, narrative, created_at")
    .single();
  if (error) throw new Error(`business_reports insert failed: ${error.message}`);
  return { ...data, summary, narrative };
}
