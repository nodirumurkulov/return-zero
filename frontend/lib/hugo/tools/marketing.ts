import "server-only";

import { tool } from "ai";

import { productIdInputSchema } from "../schemas";
import type { HugoToolContext } from "./context";
import { campaignNamesForProduct } from "./orders";

export async function fetchMarketingContext(ctx: HugoToolContext, productId: string) {
  const productCampaigns = await campaignNamesForProduct(ctx, productId);

  const { data: metaAds } = await ctx.supabase
    .from("meta_ads_daily")
    .select("campaign_name, spend_gbp, conversions, conversion_value_gbp")
    .eq("organization_id", ctx.organizationId)
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

  const { data: roasDef } = await ctx.supabase
    .from("metric_definitions")
    .select("default_threshold")
    .eq("organization_id", ctx.organizationId)
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

export function createMarketingTools(ctx: HugoToolContext) {
  return {
    getMarketingForProduct: tool({
      description: "Fetch Meta ad attribution, spend, revenue, ROAS, and campaigns below alarm threshold",
      inputSchema: productIdInputSchema,
      execute: async ({ productId }) => fetchMarketingContext(ctx, productId),
    }),
  };
}
