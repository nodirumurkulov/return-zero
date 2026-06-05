import "server-only";

import { tool } from "ai";
import { campaignNamesForProduct } from "../product-orders";
import { productIdInputSchema, type ProductIdInput } from "../schemas";
import type { AgentSupabase } from "../types";

export async function fetchMarketingContext(supabase: AgentSupabase, productId: string) {
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

  return {
    product_id: productId,
    attributed_campaigns: productCampaigns,
    roas_alarm: roasAlarm,
    campaign_summary: campaignSummary,
    low_roas_campaigns: lowRoas,
  };
}

export function createMarketingTools(supabase: AgentSupabase) {
  return {
    getCampaignAttribution: tool({
      description:
        "Fetch Meta ad campaign attribution, spend, revenue, ROAS, and campaigns below alarm threshold",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }: ProductIdInput) => fetchMarketingContext(supabase, productId),
    }),
  };
}
