import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel } from "@/lib/ai/model";
import type { KpiDirection } from "@/lib/stores/catalog/types";
import { computeMetricsDetailed } from "@/lib/stores/metrics/engine";
import {
  baselineStats,
  kpiRatioSeries,
  LEARNABLE_KPIS,
  type BaselineStats,
} from "@/lib/stores/metrics/kpi-series";
import type { MetricValue } from "@/lib/stores/metrics/metric-definition";
import type { MonthlyPoint } from "@/lib/stores/metrics/monthly-point";
import { getMonthlySeries } from "@/lib/stores/metrics/series";
import type { Database, Json } from "@/lib/supabase/database.types";

import type { Orders } from "../orders";
import { LearnError } from "./errors";
import type {
  BusinessReport,
  LearnResult,
  LearnRunOpts,
  LearnRunResult,
  ReportSummary,
} from "./types";

const K = 2;

type LearnableMetricKey = (typeof LEARNABLE_KPIS)[number];

interface MetricDef {
  id: string;
  metric_key: LearnableMetricKey;
  direction: KpiDirection;
  default_threshold: number;
}

type Stats = BaselineStats;
type TopProduct = ReportSummary["top"]["by_revenue"][number];
type LearnedPattern = ReportSummary["learned"][number];
type CountTable = "orders" | "support_tickets" | "variants";

const round = (n: number, dp = 2): number => Number(n.toFixed(dp));
const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]): number => (xs.length ? sum(xs) / xs.length : 0);

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

function derivedThreshold(def: MetricDef, s: Stats): number {
  const raw =
    def.direction === "above"
      ? Math.max(s.mean + K * s.stddev, def.default_threshold)
      : Math.min(Math.max(s.mean - K * s.stddev, 0), def.default_threshold);
  return Number(raw.toFixed(4));
}

async function headCount(
  supabase: SupabaseClient<Database>,
  table: CountTable,
  organizationId: string,
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return count ?? 0;
}

function monthlyTotals(seriesByProduct: Map<string, MonthlyPoint[]>) {
  const all = Array.from(seriesByProduct.values()).flat();
  const byMonth = all.reduce<
    Record<string, { revenue: number; refund_amount: number; units: number; refund_count: number }>
  >((acc, p) => {
    const cur = acc[p.month] ?? { revenue: 0, refund_amount: 0, units: 0, refund_count: 0 };
    acc[p.month] = {
      revenue: cur.revenue + p.revenue,
      refund_amount: cur.refund_amount + p.refund_amount,
      units: cur.units + p.units,
      refund_count: cur.refund_count + p.refund_count,
    };
    return acc;
  }, {});
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

const narrativeLlmSchema = z.object({
  narrative: z.string().min(1),
});

async function buildSummary(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ReportSummary> {
  const [
    { metrics },
    seriesByProduct,
    productRows,
    baselineRows,
    thresholdRows,
    metricDefRows,
    orders,
    support,
    skus,
  ] = await Promise.all([
    computeMetricsDetailed(supabase, { organizationId }),
    getMonthlySeries(supabase, { organizationId, months: 24 }),
    supabase.from("products").select("id, title").eq("organization_id", organizationId),
    supabase
      .from("product_baselines")
      .select("metric_definition_id, mean")
      .eq("organization_id", organizationId),
    supabase
      .from("product_kpi_thresholds")
      .select("metric_definition_id, threshold")
      .eq("organization_id", organizationId),
    supabase.from("metric_definitions").select("id, metric_key").eq("organization_id", organizationId),
    headCount(supabase, "orders", organizationId),
    headCount(supabase, "support_tickets", organizationId),
    headCount(supabase, "variants", organizationId),
  ]);

  const keyByDefId = new Map(
    (metricDefRows.data ?? []).map((d) => [d.id, d.metric_key]),
  );

  const titleOf = new Map<string, string>(
    (productRows.data ?? []).map((p) => [p.id, p.title ?? p.id]),
  );
  const displayName = new Map<string, string>();
  for (const list of Object.values(metrics)) {
    for (const m of list) displayName.set(m.metric_key, m.display_name);
  }

  const allPoints = Array.from(seriesByProduct.values()).flat();
  const revenueLifetime = sum(allPoints.map((p) => p.revenue));
  const refundAmount = sum(allPoints.map((p) => p.refund_amount));
  const units = sum(allPoints.map((p) => p.units));
  const refundCount = sum(allPoints.map((p) => p.refund_count));

  const totals = monthlyTotals(seriesByProduct);
  const revenueByMonth = totals.map((t) => t.revenue);
  const peak = totals.reduce<{ month: string; revenue: number } | null>(
    (best, t) => (best && best.revenue >= t.revenue ? best : { month: t.month, revenue: t.revenue }),
    null,
  );

  const revenueByProduct = Array.from(seriesByProduct.entries())
    .map(([id, series]) => ({
      product_id: id,
      title: titleOf.get(id) ?? id,
      value: round(sum(series.map((p) => p.revenue))),
    }))
    .sort((a, b) => b.value - a.value);

  const productMetrics = Object.entries(metrics);
  const pick = (key: string, dir: "desc" | "asc"): TopProduct[] =>
    productMetrics
      .map(([id, list]) => ({ id, mv: metricValue(list, key) }))
      .filter((x): x is { id: string; mv: MetricValue } => x.mv?.value != null)
      .sort((a, b) => (dir === "desc" ? b.mv.value! - a.mv.value! : a.mv.value! - b.mv.value!))
      .slice(0, 5)
      .map((x) => ({ product_id: x.id, title: titleOf.get(x.id) ?? x.id, value: round(x.mv.value!, 3) }));

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

  const groupAvg = (rows: { metric_key: string; v: number }[]) =>
    Object.entries(
      rows.reduce<Record<string, number[]>>((acc, r) => {
        (acc[r.metric_key] ??= []).push(r.v);
        return acc;
      }, {}),
    );
  const meanByMetric = new Map(
    groupAvg(
      (baselineRows.data ?? []).map((r) => ({
        metric_key: keyByDefId.get(r.metric_definition_id) ?? r.metric_definition_id,
        v: r.mean,
      })),
    ).map(([k, vs]) => [k, vs]),
  );
  const threshByMetric = new Map(
    groupAvg(
      (thresholdRows.data ?? []).map((r) => ({
        metric_key: keyByDefId.get(r.metric_definition_id) ?? r.metric_definition_id,
        v: r.threshold,
      })),
    ).map(([k, vs]) => [k, vs]),
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

async function narrate(summary: ReportSummary): Promise<string> {
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: narrativeLlmSchema }),
    messages: [
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
  });

  if (!output) {
    throw new LearnError("Onboarding report narrative: missing structured output");
  }

  return output.narrative;
}

export class Learn {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orders: Orders,
  ) {}

  async run(opts: LearnRunOpts): Promise<LearnRunResult> {
    await this.#seedBusinessProfile(opts.organizationId);
    const learn = await this.#learnBaselines(opts.organizationId);
    const report = await this.#buildBusinessReport(opts.organizationId);
    const { cursor: replayCursor } = await this.orders.reset({ organizationId: opts.organizationId });
    return { learn, reportId: report.id, replayCursor };
  }

  async baseline(opts: LearnRunOpts): Promise<LearnResult> {
    return this.#learnBaselines(opts.organizationId);
  }

  async report(opts: LearnRunOpts): Promise<{ id: string; summary: ReportSummary }> {
    return this.#buildBusinessReport(opts.organizationId);
  }

  async seed(opts: LearnRunOpts): Promise<void> {
    await this.#seedBusinessProfile(opts.organizationId);
  }

  async #seedBusinessProfile(organizationId: string): Promise<void> {
    const [{ data: org }, { data: topProducts }] = await Promise.all([
      this.supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
      this.supabase
        .from("products")
        .select("id")
        .eq("organization_id", organizationId)
        .order("title", { ascending: true })
        .limit(3),
    ]);

    const { error } = await this.supabase.from("business_profile").upsert({
      organization_id: organizationId,
      platform: "mock_csv",
      store_name: org?.name ?? "Demo store",
      primary_goal: "growth",
      hero_product_ids: (topProducts ?? []).map((row) => row.id),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new LearnError(`business_profile upsert failed: ${error.message}`);
    }
  }

  async #learnBaselines(organizationId: string): Promise<LearnResult> {
    const [{ data: defRows, error: defErr }, { data: settingRows }] = await Promise.all([
      this.supabase
        .from("metric_definitions")
        .select("id, metric_key, direction, default_threshold")
        .eq("organization_id", organizationId)
        .eq("enabled", true),
      this.supabase
        .from("business_settings")
        .select("key, value")
        .eq("organization_id", organizationId),
    ]);
    if (defErr) throw new LearnError(`metric_definitions read failed: ${defErr.message}`);

    const settings = new Map((settingRows ?? []).map((s) => [String(s.key), Number(s.value)]));
    const minRoas = settings.get("min_roas");

    const defs: MetricDef[] = (defRows ?? [])
      .filter((d): d is typeof d & { metric_key: LearnableMetricKey } =>
        (LEARNABLE_KPIS as readonly string[]).includes(d.metric_key),
      )
      .map((d) => ({
        id: d.id,
        metric_key: d.metric_key,
        direction: (d.direction === "below" ? "below" : "above") as KpiDirection,
        default_threshold: d.default_threshold,
      }))
      .map((d) =>
        d.metric_key === "ad_roas" && minRoas !== undefined && Number.isFinite(minRoas)
          ? { ...d, default_threshold: minRoas }
          : d,
      );

    const { streamStart: baselineEnd } = await this.orders.bounds({ organizationId });
    const seriesByProduct = await getMonthlySeries(this.supabase, { organizationId, months: 24 });

    const computed = Array.from(seriesByProduct.entries()).flatMap(([productId, series]) => {
      const baselineSeries = baselineEnd ? series.filter((p) => p.month < baselineEnd) : series;
      return defs
        .map((def) => ({
          productId,
          def,
          s: baselineStats(kpiRatioSeries(baselineSeries, def.metric_key)),
        }))
        .filter((e) => e.s.n >= 3);
    });

    const baselineRows = computed.map(({ productId, def, s }) => ({
      organization_id: organizationId,
      product_id: productId,
      metric_definition_id: def.id,
      mean: Number(s.mean.toFixed(6)),
      stddev: Number(s.stddev.toFixed(6)),
      sample_n: s.n,
    }));

    const thresholdRows = computed.map(({ productId, def, s }) => ({
      organization_id: organizationId,
      product_id: productId,
      metric_definition_id: def.id,
      threshold: derivedThreshold(def, s),
      direction: def.direction,
      active: true,
    }));

    await Promise.all(
      chunk(baselineRows, 500).map(async (rows) => {
        const { error } = await this.supabase.from("product_baselines").upsert(rows, {
          onConflict: "organization_id,product_id,metric_definition_id",
        });
        if (error) throw new LearnError(`product_baselines upsert failed: ${error.message}`);
      }),
    );

    await Promise.all(
      chunk(thresholdRows, 500).map(async (rows) => {
        const { error } = await this.supabase.from("product_kpi_thresholds").upsert(rows, {
          onConflict: "organization_id,product_id,metric_definition_id",
        });
        if (error) throw new LearnError(`product_kpi_thresholds upsert failed: ${error.message}`);
      }),
    );

    return {
      baselines: baselineRows.length,
      thresholds: thresholdRows.length,
      products: seriesByProduct.size,
    };
  }

  async #buildBusinessReport(organizationId: string): Promise<BusinessReport> {
    const summary = await buildSummary(this.supabase, organizationId);
    const narrative = await narrate(summary);
    const { data, error } = await this.supabase
      .from("business_reports")
      .insert({
        organization_id: organizationId,
        summary: summary as unknown as Json,
        narrative,
      })
      .select("id, summary, narrative, created_at")
      .single();
    if (error || !data) {
      throw new LearnError(`business_reports insert failed: ${error?.message ?? "no row"}`);
    }
    return {
      id: data.id,
      summary,
      narrative,
      created_at: data.created_at,
    };
  }
}
