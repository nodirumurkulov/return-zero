/**
 * lib/agents.ts
 * Four AI agents that investigate an incident in parallel.
 * Each agent queries Supabase for structured context, then calls the LLM.
 */

import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { callLLM } from "@/lib/llm";
import { getProductSeries } from "@/lib/metrics/series";
import { forecastForProduct } from "@/lib/forecast/product";

export type AgentFinding = {
  agent_name: string;
  agent_icon: string;
  summary: string;
  detail: Record<string, unknown>;
};

export type InvestigationResult = {
  findings: AgentFinding[];
  root_cause: string;
  root_cause_confidence: number;
  actions: Array<{
    title: string;
    description: string;
    impact_level: "high" | "medium" | "low";
    risk_level: "high" | "medium" | "low";
    auto_deploy: boolean;
  }>;
};

// ── Returns Agent ─────────────────────────────────────────────
async function runReturnsAgent(productId: string): Promise<AgentFinding> {
  const supabase = createServiceClient();

  // Fetch refunds joined to line items for this product
  const { data: refundData } = await supabase
    .from("refunds")
    .select("refund_id, amount, reason, created_at, order_id")
    .order("created_at", { ascending: false })
    .limit(500);

  const totalRefunds = refundData?.length ?? 0;
  const sizingRefunds = refundData?.filter(
    (r) => r.reason?.toLowerCase().includes("size") || r.reason?.toLowerCase().includes("fit")
  ) ?? [];
  const totalRefundGBP = refundData?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

  const reasonCounts: Record<string, number> = {};
  refundData?.forEach((r) => {
    const reason = r.reason ?? "Unknown";
    reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  });

  const context = {
    product_id: productId,
    total_refunds: totalRefunds,
    sizing_refunds: sizingRefunds.length,
    total_refund_gbp: totalRefundGBP,
    reason_breakdown: reasonCounts,
  };

  const result = await callLLM<{ summary: string; detail: Record<string, unknown> }>([
    {
      role: "system",
      content: `You are the Returns Agent for Resolve, an ecommerce incident response platform.
Analyse return data and identify patterns. Respond with a JSON object: { "summary": "...", "detail": {...} }.
The summary must be 1-2 sentences, specific, with exact numbers. The detail is structured data.`,
    },
    {
      role: "user",
      content: `Analyse these returns for product ${productId}:\n${JSON.stringify(context, null, 2)}`,
    },
  ]);

  return {
    agent_name: "Returns Agent",
    agent_icon: "📦",
    summary: result.summary ?? `${sizingRefunds.length} sizing refunds totalling £${totalRefundGBP.toFixed(0)}`,
    detail: result.detail ?? context,
  };
}

// ── Merchandising Agent ───────────────────────────────────────
async function runMerchandisingAgent(productId: string): Promise<AgentFinding> {
  const supabase = createServiceClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("product_id", productId)
    .single();

  const { data: variants } = await supabase
    .from("variants")
    .select("variant_id, option1_value, option2_value, inventory_quantity, price")
    .eq("product_id", productId);

  const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) < 0) ?? [];

  const context = {
    product,
    variant_count: variants?.length ?? 0,
    stockout_variants: stockouts.map((v) => ({
      size: v.option1_value,
      inventory: v.inventory_quantity,
    })),
    has_size_guide: false, // would come from a real Shopify metafield
  };

  const result = await callLLM<{ summary: string; detail: Record<string, unknown> }>([
    {
      role: "system",
      content: `You are the Merchandising Agent for Resolve.
Analyse product and variant data. Identify sizing gaps, stockouts, missing guidance.
Respond with JSON: { "summary": "...", "detail": {...} }. Summary must be specific with numbers.`,
    },
    {
      role: "user",
      content: `Product merchandising data:\n${JSON.stringify(context, null, 2)}`,
    },
  ]);

  return {
    agent_name: "Merchandising Agent",
    agent_icon: "🛍️",
    summary: result.summary ?? `${stockouts.length} size variants at negative stock`,
    detail: result.detail ?? context,
  };
}

// ── Marketing Agent ───────────────────────────────────────────
async function runMarketingAgent(productId: string): Promise<AgentFinding> {
  const supabase = createServiceClient();

  const { data: metaAds } = await supabase
    .from("meta_ads_daily")
    .select("campaign_name, spend_gbp, conversions, conversion_value_gbp")
    .order("date", { ascending: false })
    .limit(1000);

  // Aggregate by campaign
  const campaigns: Record<string, { spend: number; revenue: number; conversions: number }> = {};
  metaAds?.forEach((row) => {
    if (!campaigns[row.campaign_name]) {
      campaigns[row.campaign_name] = { spend: 0, revenue: 0, conversions: 0 };
    }
    campaigns[row.campaign_name].spend += Number(row.spend_gbp);
    campaigns[row.campaign_name].revenue += Number(row.conversion_value_gbp);
    campaigns[row.campaign_name].conversions += Number(row.conversions);
  });

  const campaignSummary = Object.entries(campaigns).map(([name, data]) => ({
    campaign: name,
    spend_gbp: Math.round(data.spend),
    revenue_gbp: Math.round(data.revenue),
    roas: data.spend > 0 ? +(data.revenue / data.spend).toFixed(2) : 0,
  }));

  const lowRoas = campaignSummary.filter((c) => c.roas < 1.5);

  const context = {
    product_id: productId,
    campaign_summary: campaignSummary,
    low_roas_campaigns: lowRoas,
  };

  const result = await callLLM<{ summary: string; detail: Record<string, unknown> }>([
    {
      role: "system",
      content: `You are the Marketing Agent for Resolve.
Analyse campaign performance data. Identify underperforming spend, traffic quality issues, new vs returning customer problems.
Respond with JSON: { "summary": "...", "detail": {...} }. Summary must be 1-2 sentences with exact numbers.`,
    },
    {
      role: "user",
      content: `Marketing data:\n${JSON.stringify(context, null, 2)}`,
    },
  ]);

  return {
    agent_name: "Marketing Agent",
    agent_icon: "📣",
    summary: result.summary ?? `${lowRoas.length} campaigns with ROAS < 1.5x detected`,
    detail: result.detail ?? context,
  };
}

// ── Inventory Agent ───────────────────────────────────────────
async function runInventoryAgent(productId: string): Promise<AgentFinding> {
  const supabase = createServiceClient();

  const { data: variants } = await supabase
    .from("variants")
    .select("variant_id, option1_value, inventory_quantity")
    .eq("product_id", productId);

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select("variant_id, type, quantity_delta, date")
    .in("variant_id", variants?.map((v) => v.variant_id) ?? [])
    .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: false });

  const stockouts = variants?.filter((v) => (v.inventory_quantity ?? 0) <= 0) ?? [];

  const context = {
    product_id: productId,
    stockouts: stockouts.map((v) => ({ size: v.option1_value, qty: v.inventory_quantity })),
    recent_movement_count: movements?.length ?? 0,
  };

  const result = await callLLM<{ summary: string; detail: Record<string, unknown> }>([
    {
      role: "system",
      content: `You are the Inventory Agent for Resolve.
Analyse stock levels and inventory movements. Identify stockouts, reorder urgency, cascading effects.
Respond with JSON: { "summary": "...", "detail": {...} }. Be specific with exact unit counts.`,
    },
    {
      role: "user",
      content: `Inventory data:\n${JSON.stringify(context, null, 2)}`,
    },
  ]);

  return {
    agent_name: "Inventory Agent",
    agent_icon: "🏭",
    summary: result.summary ?? `${stockouts.length} size variants at zero or negative stock`,
    detail: result.detail ?? context,
  };
}

// ── Forecasting Agent ─────────────────────────────────────────
// Deterministic forecasts computed in TS; the LLM only narrates them.
async function runForecastingAgent(productId: string): Promise<AgentFinding> {
  const supabase = createServiceClient();

  const [series, { data: outflowRows }, { data: settingsRows }] = await Promise.all([
    getProductSeries(supabase, productId, 24),
    supabase.rpc("product_daily_outflow", { p_days: 28 }),
    supabase.from("business_settings").select("key, value"),
  ]);

  const o = (outflowRows ?? []).find((r: { product_id: string }) => r.product_id === productId);
  const currentUnits = Number(o?.current_balance ?? 0);
  const dailyOutflow = Number(o?.daily_outflow ?? 0);
  const settings = new Map((settingsRows ?? []).map((r) => [r.key as string, Number(r.value)]));
  const leadDays = settings.get("lead_time_days") ?? 71;
  const bufferDays = settings.get("buffer_days") ?? 14;

  const fc = forecastForProduct(series, currentUnits, dailyOutflow, leadDays, bufferDays);
  const daysToStockout = isFinite(fc.stockout.days_to_stockout) ? Math.round(fc.stockout.days_to_stockout) : null;

  const context = {
    product_id: productId,
    current_units: currentUnits,
    days_to_stockout: daysToStockout,
    reorder_urgent: fc.stockout.reorder_urgent,
    refund_rate_forecast: +fc.refund_rate.point.toFixed(3),
    roas_forecast: +fc.roas.point.toFixed(2),
    revenue_forecast: Math.round(fc.revenue.point),
    recent_revenue_avg: Math.round(fc.recent_revenue_avg),
    methods: { stockout: fc.stockout.method, refund: fc.refund_rate.method, revenue: fc.revenue.method },
  };

  const result = await callLLM<{ summary: string; detail: Record<string, unknown> }>([
    {
      role: "system",
      content: `You are the Forecasting Agent for Resolve. You are given DETERMINISTIC forecasts that are already computed — never change the numbers. Summarise the forward-looking risk in 1-2 sentences with the exact figures. Respond with JSON: { "summary": "...", "detail": {...} }.`,
    },
    { role: "user", content: `Forecasts for product ${productId}:\n${JSON.stringify(context, null, 2)}` },
  ]);

  const fallback =
    daysToStockout !== null && fc.stockout.reorder_urgent
      ? `Forecast stockout in ~${daysToStockout} days — reorder now (lead ${leadDays}d).`
      : `Refund rate trending to ${(fc.refund_rate.point * 100).toFixed(1)}%; revenue forecast £${Math.round(fc.revenue.point)}.`;

  return {
    agent_name: "Forecasting Agent",
    agent_icon: "🔮",
    summary: result.summary ?? fallback,
    detail: result.detail ?? context,
  };
}

// ── Root Cause Synthesiser ────────────────────────────────────
async function synthesiseRootCause(
  findings: AgentFinding[]
): Promise<{ root_cause: string; root_cause_confidence: number; actions: InvestigationResult["actions"] }> {
  const result = await callLLM<{
    root_cause: string;
    root_cause_confidence: number;
    actions: InvestigationResult["actions"];
  }>([
    {
      role: "system",
      content: `You are the root cause synthesiser for Resolve, a commerce incident response platform.
Given findings from 4 agents, produce a concise root cause narrative and 3-4 concrete action recommendations.
Respond with JSON:
{
  "root_cause": "...",
  "root_cause_confidence": 85,
  "actions": [
    {
      "title": "...",
      "description": "...",
      "impact_level": "high|medium|low",
      "risk_level": "high|medium|low",
      "auto_deploy": false
    }
  ]
}
Root cause should be 2-3 sentences, specific, mentioning exact numbers from the findings.
Auto-deploy should only be true for low-risk, purely additive actions (e.g. adding content).`,
    },
    {
      role: "user",
      content: `Agent findings:\n${JSON.stringify(findings, null, 2)}`,
    },
  ]);

  return {
    root_cause: result.root_cause ?? "Under investigation",
    root_cause_confidence: result.root_cause_confidence ?? 70,
    actions: result.actions ?? [],
  };
}

// ── Orchestrator ──────────────────────────────────────────────
export async function runInvestigation(
  incidentId: string,
  productId: string
): Promise<InvestigationResult> {
  // All agents run in parallel
  const [returns, merch, marketing, inventory, forecasting] = await Promise.all([
    runReturnsAgent(productId),
    runMerchandisingAgent(productId),
    runMarketingAgent(productId),
    runInventoryAgent(productId),
    runForecastingAgent(productId),
  ]);

  const findings = [returns, merch, marketing, inventory, forecasting];
  const { root_cause, root_cause_confidence, actions } =
    await synthesiseRootCause(findings);

  return { findings, root_cause, root_cause_confidence, actions };
}
