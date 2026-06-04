import "server-only";
import { callLLMJson } from "@/lib/llm";
import { campaignNamesForProduct } from "./product-orders";
import { agentFindingLlmSchema } from "./schemas";
import type { AgentSupabase, LlmAgentFinding } from "./types";

export async function runMarketingAgent(
  supabase: AgentSupabase,
  productId: string,
): Promise<LlmAgentFinding> {
  const productCampaigns = await campaignNamesForProduct(supabase, productId);

  const { data: metaAds } = await supabase
    .from("meta_ads_daily")
    .select("campaign_name, spend_gbp, conversions, conversion_value_gbp")
    .order("date", { ascending: false })
    .limit(1000);

  const campaignSet = new Set(productCampaigns);
  const scopedRows =
    productCampaigns.length === 0
      ? []
      : (metaAds ?? []).filter((row) => row.campaign_name && campaignSet.has(row.campaign_name));

  const campaigns: Record<string, { spend: number; revenue: number; conversions: number }> = {};
  scopedRows.forEach((row) => {
    const name = row.campaign_name;
    if (!name) return;
    if (!campaigns[name]) {
      campaigns[name] = { spend: 0, revenue: 0, conversions: 0 };
    }
    campaigns[name].spend += Number(row.spend_gbp);
    campaigns[name].revenue += Number(row.conversion_value_gbp);
    campaigns[name].conversions += Number(row.conversions);
  });

  const campaignSummary = Object.entries(campaigns).map(([name, data]) => ({
    campaign: name,
    spend_gbp: Math.round(data.spend),
    revenue_gbp: Math.round(data.revenue),
    roas: data.spend > 0 ? +(data.revenue / data.spend).toFixed(2) : 0,
  }));

  const { data: roasDef } = await supabase
    .from("metric_definitions")
    .select("default_threshold")
    .eq("metric_key", "ad_roas")
    .single();
  const roasAlarm = Number(roasDef?.default_threshold ?? 1.5);
  const lowRoas = campaignSummary.filter((c) => c.roas < roasAlarm);

  const context = {
    product_id: productId,
    attributed_campaigns: productCampaigns,
    roas_alarm: roasAlarm,
    campaign_summary: campaignSummary,
    low_roas_campaigns: lowRoas,
  };

  const result = await callLLMJson(
    [
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
    ],
    agentFindingLlmSchema,
  );

  return {
    agent_name: "Marketing Agent",
    agent_icon: "📣",
    summary:
      result?.summary ??
      `${lowRoas.length} campaigns below the ${roasAlarm}x ROAS alarm (${productCampaigns.length} attributed)`,
    detail: result?.detail ?? context,
  };
}
