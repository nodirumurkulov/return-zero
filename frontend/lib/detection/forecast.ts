import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthlySeries } from "../metrics/series";
import { forecastForProduct, type ProductForecast } from "../forecast/product";

// Predictive detection: forecast each product forward and open FORWARD-LOOKING
// incidents from config-driven forecast_rules — the "alert before the loss"
// half of the product. Deterministic; reuses RUN-20's dedup + insert pattern.

const SEV_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const OPEN_EXCLUDED = ["resolved", "canceled"];

interface ForecastRule {
  rule_key: string;
  kind: "stockout" | "refund_trend" | "roas_decay" | "revenue_drop";
  horizon_days: number;
  threshold: number;
  severity: string;
}

interface Risk {
  kind: string;
  rule_key: string;
  severity: string;
  message: string;
  impact_amount: number;
}

export interface CreatedForecastIncident {
  incident_id: string;
  product_id: string;
  title: string;
  severity: string;
  kinds: string[];
}

export interface ForecastDetectionResult {
  scanned: number;
  created: CreatedForecastIncident[];
  skipped: { product_id: string; reason: string }[];
}

function evaluateRule(rule: ForecastRule, fc: ProductForecast, leadDays: number): Risk | null {
  switch (rule.kind) {
    case "stockout": {
      const d = fc.stockout.days_to_stockout;
      // Only a *prediction*: must have stock now and be heading to zero within the window.
      if (fc.stockout.current_units <= 0 || !isFinite(d) || d <= 0 || d > rule.threshold) return null;
      const lostUnits = fc.stockout.daily_demand * leadDays;
      return {
        kind: rule.kind,
        rule_key: rule.rule_key,
        severity: rule.severity,
        message: `forecast stockout in ~${Math.round(d)} days`,
        impact_amount: Math.round(lostUnits * fc.avg_price),
      };
    }
    case "refund_trend": {
      if (fc.refund_rate.point < rule.threshold) return null;
      return {
        kind: rule.kind,
        rule_key: rule.rule_key,
        severity: rule.severity,
        message: `refund rate trending to ${(fc.refund_rate.point * 100).toFixed(1)}%`,
        impact_amount: Math.round(fc.refund_rate.point * fc.recent_revenue_avg),
      };
    }
    case "roas_decay": {
      if (fc.roas.point <= 0 || fc.roas.point > rule.threshold) return null;
      return {
        kind: rule.kind,
        rule_key: rule.rule_key,
        severity: rule.severity,
        message: `ROAS forecast ${fc.roas.point.toFixed(2)} (target ≥${rule.threshold})`,
        impact_amount: Math.round(fc.recent_ad_spend_avg),
      };
    }
    case "revenue_drop": {
      const floor = fc.recent_revenue_avg * (1 - rule.threshold);
      if (fc.recent_revenue_avg <= 0 || fc.revenue.point >= floor) return null;
      return {
        kind: rule.kind,
        rule_key: rule.rule_key,
        severity: rule.severity,
        message: `revenue forecast £${Math.round(fc.revenue.point)} (~${Math.round((1 - fc.revenue.point / fc.recent_revenue_avg) * 100)}% below recent)`,
        impact_amount: Math.round(fc.recent_revenue_avg - fc.revenue.point),
      };
    }
    default:
      return null;
  }
}

export async function detectForecastRisks(supabase: SupabaseClient): Promise<ForecastDetectionResult> {
  const [{ data: ruleRows, error: ruleErr }, { data: setRows }, { data: outflowRows }, { data: incRows }, { data: prodRows }] =
    await Promise.all([
      supabase.from("forecast_rules").select("*").eq("enabled", true),
      supabase.from("business_settings").select("key, value"),
      supabase.rpc("product_daily_outflow", { p_days: 28 }),
      supabase.from("incidents").select("affected_product, status"),
      supabase.from("products").select("product_id, title"),
    ]);
  if (ruleErr) throw new Error(`load forecast_rules: ${ruleErr.message}`);

  const rules = (ruleRows ?? []).map((r) => ({ ...r, threshold: Number(r.threshold), horizon_days: Number(r.horizon_days) })) as ForecastRule[];
  const settings = new Map((setRows ?? []).map((s) => [s.key as string, Number(s.value)]));
  const leadDays = settings.get("lead_time_days") ?? 71;
  const bufferDays = settings.get("buffer_days") ?? 14;

  // recent inventory burn rate + current stock per product
  const outflow = new Map<string, { daily: number; balance: number }>();
  for (const r of outflowRows ?? []) {
    outflow.set(r.product_id as string, { daily: Number(r.daily_outflow ?? 0), balance: Number(r.current_balance ?? 0) });
  }
  const openProducts = new Set(
    (incRows ?? []).filter((r) => r.affected_product && !OPEN_EXCLUDED.includes(r.status as string)).map((r) => r.affected_product as string)
  );
  const titleById = new Map((prodRows ?? []).map((p) => [p.product_id as string, (p.title as string) ?? (p.product_id as string)]));

  const seriesByProduct = await getMonthlySeries(supabase, { months: 24 });

  const created: CreatedForecastIncident[] = [];
  const skipped: ForecastDetectionResult["skipped"] = [];
  const entries = Array.from(seriesByProduct.entries());

  for (const [productId, series] of entries) {
    const o = outflow.get(productId) ?? { daily: 0, balance: 0 };
    const fc = forecastForProduct(series, o.balance, o.daily, leadDays, bufferDays);
    const risks = rules.map((r) => evaluateRule(r, fc, leadDays)).filter((r): r is Risk => r !== null);
    if (risks.length === 0) continue;
    if (openProducts.has(productId)) {
      skipped.push({ product_id: productId, reason: "open incident exists" });
      continue;
    }

    risks.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.impact_amount - a.impact_amount);
    const primary = risks[0];
    const productTitle = titleById.get(productId) ?? productId;
    const title = `${productTitle}: ${primary.message}`;

    const { data: inc, error: insErr } = await supabase
      .from("incidents")
      .insert({
        title,
        status: "detected",
        severity: primary.severity,
        impact_amount: primary.impact_amount,
        impact_label: "forecast risk",
        affected_product: productId,
        affected_kpis: risks.map((r) => r.kind),
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
        description: `Predictive: ${risks.map((r) => r.message).join("; ")}`,
        metadata: { forecast: true, risks },
      },
      {
        incident_id: inc.id,
        event_type: "incident_created",
        description: `Forward-looking incident opened for ${productTitle} (severity: ${primary.severity})`,
      },
    ]);

    created.push({ incident_id: inc.id as string, product_id: productId, title, severity: primary.severity, kinds: risks.map((r) => r.kind) });
  }

  return { scanned: entries.length, created, skipped };
}
