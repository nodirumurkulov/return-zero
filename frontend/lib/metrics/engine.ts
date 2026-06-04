import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Direction,
  MetricDefinition,
  MetricStatus,
  MetricValue,
  ProductSourceFacts,
  ThresholdOverride,
} from "./types";
import { getSourceFacts } from "./sources";

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

function statusFor(value: number | null, threshold: number, direction: Direction): MetricStatus {
  if (value === null) return "healthy";
  const breached = direction === "above" ? value > threshold : value < threshold;
  if (breached) return "critical";
  const near =
    direction === "above"
      ? value >= threshold * (1 - WARNING_BAND)
      : value <= threshold * (1 + WARNING_BAND);
  return near ? "warning" : "healthy";
}

export interface ComputeOpts {
  productId?: string; // restrict to one product
  windowDays?: number; // override each definition's own window
}

/**
 * Evaluate the enabled metric_definitions against source facts, applying any
 * per-product threshold overrides. The KPI set comes entirely from config, so
 * the same engine works for any business whose data is in the contract schema.
 *
 * Returns metrics keyed by product_id (each list ordered by definition sort_order).
 */
export async function computeMetrics(
  supabase: SupabaseClient,
  opts: ComputeOpts = {}
): Promise<Record<string, MetricValue[]>> {
  const [{ data: defsData, error: defsErr }, { data: ovrData, error: ovrErr }] = await Promise.all([
    supabase.from("metric_definitions").select("*").eq("enabled", true).order("sort_order"),
    supabase.from("product_kpi_thresholds").select("*").eq("active", true),
  ]);
  if (defsErr) throw new Error(`load metric_definitions: ${defsErr.message}`);
  if (ovrErr) throw new Error(`load product_kpi_thresholds: ${ovrErr.message}`);

  const defs: MetricDefinition[] = (defsData ?? []).map((d) => ({
    ...(d as MetricDefinition),
    default_threshold: Number((d as MetricDefinition).default_threshold),
    window_days: Number((d as MetricDefinition).window_days),
  }));

  const overrides = new Map<string, ThresholdOverride>();
  for (const o of (ovrData ?? []) as ThresholdOverride[]) {
    overrides.set(`${o.product_id}:${o.metric_key}`, { ...o, threshold: Number(o.threshold) });
  }

  // Fetch source facts once per distinct window in play (usually just one).
  const windows = opts.windowDays
    ? new Set([opts.windowDays])
    : new Set(defs.map((d) => d.window_days));
  const factsByWindow = new Map<number, Map<string, ProductSourceFacts>>();
  for (const w of Array.from(windows)) {
    factsByWindow.set(w, await getSourceFacts(supabase, w));
  }

  const result: Record<string, MetricValue[]> = {};
  for (const def of defs) {
    const facts = factsByWindow.get(opts.windowDays ?? def.window_days)!;
    for (const [productId, f] of Array.from(facts)) {
      if (opts.productId && productId !== opts.productId) continue;
      const override = overrides.get(`${productId}:${def.metric_key}`);
      const threshold = override?.threshold ?? def.default_threshold;
      const direction = override?.direction ?? def.direction;
      const value = evalValue(def, f);
      (result[productId] ??= []).push({
        metric_key: def.metric_key,
        display_name: def.display_name,
        unit: def.unit,
        value,
        threshold,
        direction,
        status: statusFor(value, threshold, direction),
        severity: def.severity,
      });
    }
  }
  return result;
}

/** Metrics for a single product, ordered by definition sort_order. */
export async function computeProductMetrics(
  supabase: SupabaseClient,
  productId: string,
  windowDays?: number
): Promise<MetricValue[]> {
  const all = await computeMetrics(supabase, { productId, windowDays });
  return all[productId] ?? [];
}
