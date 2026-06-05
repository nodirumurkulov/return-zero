import type { SupabaseClient } from "@supabase/supabase-js";

import { computeMetricsDetailed } from "@/lib/stores/metrics/engine";
import type { ProductSourceFacts } from "@/lib/stores/metrics/source-facts";
import type { Database } from "@/lib/supabase/database.types";

import { TERMINAL_INCIDENT_STATUSES } from "./status";

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function severityRank(s: string): number {
  return SEV_RANK[s] ?? 2;
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
  constructor(private readonly supabase: SupabaseClient<Database>) {}

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
      (prodRows ?? []).map((p) => [p.id, p.title ?? p.id]),
    );

    const created: CreatedIncident[] = [];
    const skipped: DetectionResult["skipped"] = [];
    const productIds = Object.keys(metrics);
    const organizationId = opts.organizationId;

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
      const severity = primary.def.severity;
      const value = primary.m.value ?? 0;

      const productTitle = titleById.get(productId) ?? productId;
      const target = `${primary.m.direction === "above" ? "≤" : "≥"}${fmtValue(primary.m.unit, primary.m.threshold)}`;
      const title = `${productTitle}: ${primary.m.display_name} ${fmtValue(primary.m.unit, value)} (target ${target})`;
      const affected_kpi_keys = breached.map((m) => m.metric_key);

      const { data: inc, error: insErr } = await this.supabase
        .from("incidents")
        .insert({
          organization_id: organizationId,
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
          organization_id: organizationId,
          event_type: "anomaly_detected",
          description: `${affected_kpi_keys.length} KPI breach(es): ${affected_kpi_keys.join(", ")}`,
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
          organization_id: organizationId,
          event_type: "incident_created",
          description: `Incident opened for ${productTitle} (severity: ${severity})`,
        },
      ]);

      created.push({
        incident_id: inc.id,
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
