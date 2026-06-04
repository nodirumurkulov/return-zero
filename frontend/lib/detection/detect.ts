import type { SupabaseClient } from "@supabase/supabase-js";
import { computeMetricsDetailed } from "../metrics/engine";
import { getMonthlySeries } from "../metrics/series";
import type { ProductSourceFacts } from "../metrics/types";
import { notifyNewIncident } from "../slack";
import { breachMagnitude, metricTrendWorsening, scoreSeverity, severityRank } from "./severity";

// Deterministic KPI breach detection. Runs the config-driven metrics engine over
// the catalogue and opens an incident per product with one or more critical
// breaches. No LLM here — detection is plain math; the agents narrate later.

const OPEN_EXCLUDED = ["resolved", "canceled"];

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
  affected_kpis: string[];
  impact_amount: number;
}

export interface DetectionResult {
  scanned: number;
  created: CreatedIncident[];
  skipped: { product_id: string; reason: string }[];
}

export async function detectBreaches(supabase: SupabaseClient): Promise<DetectionResult> {
  const { defs, factsByWindow, metrics } = await computeMetricsDetailed(supabase);
  const defByKey = new Map(defs.map((d) => [d.metric_key, d]));

  // Dedup: products that already have an open incident.
  const { data: incidentRows, error: incErr } = await supabase
    .from("incidents")
    .select("affected_product, status");
  if (incErr) throw new Error(`load incidents: ${incErr.message}`);
  const openProducts = new Set(
    (incidentRows ?? [])
      .filter((r) => r.affected_product && !OPEN_EXCLUDED.includes(r.status as string))
      .map((r) => r.affected_product as string)
  );

  // Readable titles.
  const { data: prodRows } = await supabase.from("products").select("product_id, title");
  const titleById = new Map(
    (prodRows ?? []).map((p) => [p.product_id as string, (p.title as string) ?? (p.product_id as string)])
  );

  // Monthly series for trend input to severity scoring.
  const seriesByProduct = await getMonthlySeries(supabase, { months: 24 });

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

    // Primary breach drives severity/impact/title: highest severity, then largest £ impact.
    const ranked = breached
      .map((m) => {
        const def = defByKey.get(m.metric_key)!;
        const facts = factsByWindow.get(def.window_days)!.get(productId)!;
        return { m, def, impact: factColumn(facts, def.impact_source, def.impact_field) };
      })
      .sort((a, b) => severityRank(b.def.severity) - severityRank(a.def.severity) || b.impact - a.impact);
    const primary = ranked[0];

    const value = primary.m.value ?? 0;
    const series = seriesByProduct.get(productId) ?? [];
    const severity = scoreSeverity({
      baseSeverity: primary.def.severity,
      magnitude: breachMagnitude(value, primary.m.threshold, primary.m.direction),
      impactAmount: primary.impact,
      worsening: metricTrendWorsening(primary.m.metric_key, series, primary.m.direction),
    });

    const productTitle = titleById.get(productId) ?? productId;
    const target = `${primary.m.direction === "above" ? "≤" : "≥"}${fmtValue(primary.m.unit, primary.m.threshold)}`;
    const title = `${productTitle}: ${primary.m.display_name} ${fmtValue(primary.m.unit, value)} (target ${target})`;
    const affected_kpis = breached.map((m) => m.metric_key);

    const { data: inc, error: insErr } = await supabase
      .from("incidents")
      .insert({
        title,
        status: "detected",
        severity,
        impact_amount: Math.round(primary.impact),
        impact_label: primary.def.impact_label,
        affected_product: productId,
        affected_kpis,
      })
      .select("id")
      .single();
    if (insErr || !inc) {
      skipped.push({ product_id: productId, reason: `insert failed: ${insErr?.message ?? "no row"}` });
      continue;
    }

    await supabase.from("incident_timeline").insert([
      {
        incident_id: inc.id,
        event_type: "anomaly_detected",
        description: `${affected_kpis.length} KPI breach(es): ${affected_kpis.join(", ")}`,
        metadata: {
          breaches: ranked.map((r) => ({
            metric: r.m.metric_key,
            value: r.m.value,
            threshold: r.m.threshold,
            direction: r.m.direction,
          })),
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
      affected_kpis,
      impact_amount: Math.round(primary.impact),
    });

    await notifyNewIncident({
      incident_id: inc.id as string,
      title,
      severity,
      impact_amount: Math.round(primary.impact),
      impact_label: primary.def.impact_label,
    });
  }

  return { scanned: productIds.length, created, skipped };
}
