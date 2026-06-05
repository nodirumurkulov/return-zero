import type { SupabaseClient } from "@supabase/supabase-js";

import { computeMetricsDetailed } from "@/lib/stores/metrics/engine";
import { baselineStats, kpiRatioSeries } from "@/lib/stores/metrics/kpi-series";
import type { MonthlyPoint } from "@/lib/stores/metrics/monthly-point";
import { getMonthlySeries } from "@/lib/stores/metrics/series";
import type { ProductSourceFacts } from "@/lib/stores/metrics/source-facts";

import {
  confidenceFromN,
  confidenceInterval,
  zScore,
  type Confidence,
} from "@/lib/stores/metrics/spc";
import { breachMagnitude, metricTrendWorsening, scoreSeverity, severityRank, zSeverityBoost } from "./severity";
import { TERMINAL_INCIDENT_STATUSES } from "./status";

type BaselineRow = { metric_key: string; mean: number; stddev: number; sample_n: number };

interface QuantProfile {
  metric_key: string;
  value: number;
  baseline_source: "learned" | "series" | "none";
  mean: number | null;
  sigma: number | null;
  sample_n: number | null;
  z_score: number | null;
  ci: { lower: number; upper: number } | null;
  confidence: Confidence;
}

function quantProfile(
  metricKey: string,
  value: number,
  stored: BaselineRow | undefined,
  series: MonthlyPoint[],
): QuantProfile {
  const fallback = stored
    ? null
    : (() => {
        const s = baselineStats(kpiRatioSeries(series, metricKey));
        return s.n > 0 ? s : null;
      })();
  const stats = stored
    ? { mean: stored.mean, stddev: stored.stddev, n: stored.sample_n }
    : fallback;
  const source: QuantProfile["baseline_source"] = stored ? "learned" : fallback ? "series" : "none";

  if (!stats) {
    return {
      metric_key: metricKey,
      value,
      baseline_source: "none",
      mean: null,
      sigma: null,
      sample_n: null,
      z_score: null,
      ci: null,
      confidence: "none",
    };
  }
  return {
    metric_key: metricKey,
    value,
    baseline_source: source,
    mean: stats.mean,
    sigma: stats.stddev,
    sample_n: stats.n,
    z_score: zScore(value, stats.mean, stats.stddev),
    ci: confidenceInterval(stats.mean, stats.stddev, stats.n),
    confidence: confidenceFromN(stats.n),
  };
}

function factColumn(facts: ProductSourceFacts, source: string | null, field: string | null): number {
  if (!source || !field) return 0;
  const key = `${source}_${field}` as keyof ProductSourceFacts;
  const v = facts[key];
  return typeof v === "number" ? v : 0;
}

function fmtValue(unit: string, value: number): string {
  if (unit === "ratio" || unit === "percentage") return `${(value * 100).toFixed(1)}%`;
  if (unit === "currency") return `£${Math.round(value).toLocaleString("en-GB")}`;
  return `${Math.round(value)}`;
}

export interface CreatedIncident {
  incident_id: string;
  product_id: string;
  title: string;
  severity: string;
  affected_kpi_keys: string[];
  impact_amount: number;
  impact_label: string | null;
}

export interface DetectionResult {
  scanned: number;
  created: CreatedIncident[];
  skipped: { product_id: string; reason: string }[];
}

export interface DetectOpts {
  organizationId: string;
  asOf?: string;
}

export class BreachDetector {
  constructor(private readonly supabase: SupabaseClient) {}

  async run(opts: DetectOpts): Promise<DetectionResult> {
    const { defs, factsByWindow, metrics } = await computeMetricsDetailed(this.supabase, {
      organizationId: opts.organizationId,
      asOf: opts.asOf,
    });
    const defByKey = new Map(defs.map((d) => [d.metric_key, d]));

    const { data: incidentRows, error: incErr } = await this.supabase
      .from("incidents")
      .select("product_id, status")
      .eq("organization_id", opts.organizationId);
    if (incErr) throw new Error(`load incidents: ${incErr.message}`);
    const openProducts = new Set(
      (incidentRows ?? [])
        .filter(
          (r) =>
            r.product_id && !(TERMINAL_INCIDENT_STATUSES as readonly string[]).includes(r.status as string),
        )
        .map((r) => r.product_id as string),
    );

    const { data: prodRows } = await this.supabase
      .from("products")
      .select("id, title")
      .eq("organization_id", opts.organizationId);
    const titleById = new Map(
      (prodRows ?? []).map((p) => [p.id as string, (p.title as string) ?? (p.id as string)]),
    );

    const seriesByProduct = await getMonthlySeries(this.supabase, {
      organizationId: opts.organizationId,
      months: 24,
    });

    const { data: mdRows } = await this.supabase
      .from("metric_definitions")
      .select("id, metric_key")
      .eq("organization_id", opts.organizationId);
    const keyByDefId = new Map((mdRows ?? []).map((d) => [String(d.id), String(d.metric_key)]));
    const { data: baselineRows } = await this.supabase
      .from("product_baselines")
      .select("product_id, metric_definition_id, mean, stddev, sample_n")
      .eq("organization_id", opts.organizationId);
    const baselineByKey = new Map<string, BaselineRow>(
      (baselineRows ?? []).flatMap((r) => {
        const metricKey = keyByDefId.get(String(r.metric_definition_id));
        if (!metricKey) return [];
        return [
          [
            `${r.product_id}:${metricKey}`,
            {
              metric_key: metricKey,
              mean: Number(r.mean),
              stddev: Number(r.stddev),
              sample_n: Number(r.sample_n),
            },
          ] as const,
        ];
      }),
    );

    const created: CreatedIncident[] = [];
    const skipped: DetectionResult["skipped"] = [];
    const productIds = Object.keys(metrics);

    for (const productId of productIds) {
      const breached = metrics[productId].filter((m) => m.status === "critical");
      if (breached.length === 0) continue;
      if (openProducts.has(productId)) {
        skipped.push({ product_id: productId, reason: "open incident exists" });
        continue;
      }

      const ranked = breached
        .map((m) => {
          const def = defByKey.get(m.metric_key)!;
          const facts = factsByWindow.get(def.window_days)!.get(productId)!;
          return { m, def, impact: factColumn(facts, def.impact_source, def.impact_field) };
        })
        .sort(
          (a, b) => severityRank(b.def.severity) - severityRank(a.def.severity) || b.impact - a.impact,
        );
      const primary = ranked[0];

      const value = primary.m.value ?? 0;
      const fullSeries = seriesByProduct.get(productId) ?? [];
      const series = opts.asOf ? fullSeries.filter((p) => p.month <= opts.asOf!) : fullSeries;
      const profile = quantProfile(
        primary.m.metric_key,
        value,
        baselineByKey.get(`${productId}:${primary.m.metric_key}`),
        series,
      );
      const severity = scoreSeverity({
        baseSeverity: primary.def.severity,
        magnitude: breachMagnitude(value, primary.m.threshold, primary.m.direction),
        impactAmount: primary.impact,
        worsening: metricTrendWorsening(primary.m.metric_key, series, primary.m.direction),
        zBoost: zSeverityBoost(profile.z_score, profile.confidence),
      });

      const productTitle = titleById.get(productId) ?? productId;
      const target = `${primary.m.direction === "above" ? "≤" : "≥"}${fmtValue(primary.m.unit, primary.m.threshold)}`;
      const title = `${productTitle}: ${primary.m.display_name} ${fmtValue(primary.m.unit, value)} (target ${target})`;
      const affected_kpi_keys = breached.map((m) => m.metric_key);

      const { data: inc, error: insErr } = await this.supabase
        .from("incidents")
        .insert({
          organization_id: opts.organizationId,
          title,
          status: "detected",
          severity,
          impact_amount: Math.round(primary.impact),
          impact_label: primary.def.impact_label,
          product_id: productId,
          affected_kpi_keys,
        })
        .select("id")
        .single();
      if (insErr || !inc) {
        skipped.push({ product_id: productId, reason: `insert failed: ${insErr?.message ?? "no row"}` });
        continue;
      }

      await this.supabase.from("incident_timeline").insert([
        {
          incident_id: inc.id,
          event_type: "anomaly_detected",
          description: `${affected_kpi_keys.length} KPI breach(es): ${affected_kpi_keys.join(", ")}`,
          metadata: {
            breaches: ranked.map((r) => ({
              metric: r.m.metric_key,
              value: r.m.value,
              threshold: r.m.threshold,
              direction: r.m.direction,
            })),
            quant: profile,
          },
        },
        {
          incident_id: inc.id,
          event_type: "incident_created",
          description: `Incident opened for ${productTitle} (severity: ${severity})`,
        },
      ]);

      created.push({
        incident_id: inc.id as string,
        product_id: productId,
        title,
        severity,
        affected_kpi_keys,
        impact_amount: Math.round(primary.impact),
        impact_label: primary.def.impact_label,
      });
    }

    return { scanned: productIds.length, created, skipped };
  }
}
