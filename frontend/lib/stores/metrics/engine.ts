import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { METRIC_KEYS, type MetricKey } from "../catalog/types";
import type {
  ComputeOpts,
  KpiDirection,
  KpiHealthStatus,
  MetricDefinition,
  MetricValue,
  ThresholdOverride,
} from "./metric-definition";
import { getSourceFacts, type ProductSourceFacts } from "./source-facts";

export type { ComputeOpts };

// Within 10% of the threshold (on the safe side) counts as a warning.
const WARNING_BAND = 0.1;

function factField(facts: ProductSourceFacts, source: string, field: string): number {
  const key = `${source}_${field}` as keyof ProductSourceFacts;
  const v = facts[key];
  return typeof v === "number" ? v : 0;
}

// Evaluate a definition against one product's facts. No eval — `operation` is a
// closed set, and (source, field) only ever index known fact columns.
function evalValue(def: MetricDefinition, facts: ProductSourceFacts): number | null {
  const numerator = factField(facts, def.numerator_source, def.numerator_field);
  if (def.operation === "value") return numerator;
  if (!def.denominator_source || !def.denominator_field) return numerator;
  const denominator = factField(facts, def.denominator_source, def.denominator_field);
  if (denominator === 0) return null; // ratio undefined (no denominator activity)
  return numerator / denominator;
}

/** Pure KPI status from value vs threshold (exported for unit tests). */
export function metricStatusFor(
  value: number | null,
  threshold: number,
  direction: KpiDirection,
): KpiHealthStatus {
  if (value === null) return "healthy";
  const breached = direction === "above" ? value > threshold : value < threshold;
  if (breached) return "critical";
  const near =
    direction === "above"
      ? value >= threshold * (1 - WARNING_BAND)
      : value <= threshold * (1 + WARNING_BAND);
  return near ? "warning" : "healthy";
}

export interface EngineRun {
  defs: MetricDefinition[];
  factsByWindow: Map<number, Map<string, ProductSourceFacts>>;
  metrics: Record<string, MetricValue[]>;
}

/**
 * Core engine pass — evaluates the enabled metric_definitions against source
 * facts (applying per-product threshold overrides) and returns the metrics PLUS
 * the definitions and the source-facts maps. Breach detection uses the extra
 * data to compute £ impact without a second RPC. KPI set comes entirely from
 * config, so the same engine works for any business in the contract schema.
 */
export async function computeMetricsDetailed(
  supabase: SupabaseClient<Database>,
  opts: ComputeOpts,
): Promise<EngineRun> {
  const [{ data: defsData, error: defsErr }, { data: ovrData, error: ovrErr }] = await Promise.all([
    supabase
      .from("metric_definitions")
      .select("*")
      .eq("organization_id", opts.organizationId)
      .eq("enabled", true)
      .order("sort_order"),
    supabase
      .from("product_kpi_thresholds")
      .select("product_id, metric_definition_id, threshold, direction, active")
      .eq("organization_id", opts.organizationId)
      .eq("active", true),
  ]);
  if (defsErr) throw new Error(`load metric_definitions: ${defsErr.message}`);
  if (ovrErr) throw new Error(`load product_kpi_thresholds: ${ovrErr.message}`);

  const defs: MetricDefinition[] = defsData ?? [];

  const overrides = new Map<string, ThresholdOverride>();
  for (const o of ovrData ?? []) {
    overrides.set(`${o.product_id}:${o.metric_definition_id}`, {
      product_id: o.product_id,
      metric_definition_id: o.metric_definition_id,
      threshold: Number(o.threshold),
      direction: o.direction,
      active: o.active,
    });
  }

  // Fetch source facts once per distinct window in play (usually just one).
  const windows = opts.windowDays
    ? new Set([opts.windowDays])
    : new Set(defs.map((d) => d.window_days));
  const factsByWindow = new Map<number, Map<string, ProductSourceFacts>>();
  for (const w of Array.from(windows)) {
    factsByWindow.set(
      w,
      await getSourceFacts(supabase, opts.organizationId, w, opts.asOf),
    );
  }

  const metrics: Record<string, MetricValue[]> = {};
  for (const def of defs) {
    if (!(METRIC_KEYS as readonly string[]).includes(def.metric_key)) continue;
    const facts = factsByWindow.get(opts.windowDays ?? def.window_days)!;
    for (const [productId, f] of Array.from(facts)) {
      if (opts.productId && productId !== opts.productId) continue;
      const override = overrides.get(`${productId}:${def.id}`);
      const threshold = override?.threshold ?? def.default_threshold;
      const direction = override?.direction ?? def.direction;
      const value = evalValue(def, f);
      (metrics[productId] ??= []).push({
        metric_key: def.metric_key as MetricKey,
        display_name: def.display_name,
        unit: def.unit,
        value,
        threshold,
        direction,
        status: metricStatusFor(value, threshold, direction),
        severity: def.severity,
      });
    }
  }
  return { defs, factsByWindow, metrics };
}

/**
 * Metrics keyed by product_id (each list ordered by definition sort_order).
 */
export async function computeMetrics(
  supabase: SupabaseClient<Database>,
  opts: ComputeOpts,
): Promise<Record<string, MetricValue[]>> {
  return (await computeMetricsDetailed(supabase, opts)).metrics;
}

/** Metrics for a single product, ordered by definition sort_order. */
export async function computeProductMetrics(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
  windowDays?: number,
): Promise<MetricValue[]> {
  const all = await computeMetrics(supabase, { organizationId, productId, windowDays });
  return all[productId] ?? [];
}
