import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { StoreScope } from "@/lib/tenancy/types";

import { getProductSeries } from "./series";

const SERIES_MONTHS = 6;
const SUPPORT_LIMIT = 5;

type CampaignSummary = {
  campaign: string;
  spend_gbp: number;
  revenue_gbp: number;
  roas: number;
};

type SupportTicketRow = Pick<
  Database["public"]["Tables"]["support_tickets"]["Row"],
  "category" | "priority" | "status" | "subject"
>;

export type ProductDeepContext = {
  productId: string;
  latest: {
    month: string;
    refundRate: number;
    refundAmount: number;
    refundCount: number;
    roas: number | null;
    adSpend: number;
    adRevenue: number;
  } | null;
  previous: {
    month: string;
    refundRate: number;
    roas: number | null;
  } | null;
  marketing: ProductMarketingContext;
  supportTickets: SupportTicketRow[];
};

export type ProductMarketingContext = {
  product_id: string;
  roas_alarm: number;
  campaign_summary: CampaignSummary[];
  low_roas_campaigns: CampaignSummary[];
};

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function roas(revenue: number, spend: number): number | null {
  return spend > 0 ? revenue / spend : null;
}

export async function getProductDeepContext(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
  productId: string,
): Promise<ProductDeepContext> {
  const [series, marketing, ticketsRes] = await Promise.all([
    getProductSeries(supabase, scope, productId, SERIES_MONTHS),
    getProductMarketingContext(supabase, scope, productId),
    supabase
      .from("support_tickets")
      .select("subject, status, priority, category")
      .eq("organization_id", scope.organizationId)
      .eq("store_id", scope.storeId)
      .eq("related_product_id", productId)
      .limit(SUPPORT_LIMIT),
  ]);

  if (ticketsRes.error) {
    throw new Error(`support_tickets read failed: ${ticketsRes.error.message}`);
  }

  const recent = series.at(-1);
  const previous = series.at(-2);

  return {
    productId,
    latest: recent
      ? {
          month: recent.month,
          refundRate: rate(recent.refund_amount, recent.revenue),
          refundAmount: recent.refund_amount,
          refundCount: recent.refund_count,
          roas: roas(recent.ad_revenue, recent.ad_spend),
          adSpend: recent.ad_spend,
          adRevenue: recent.ad_revenue,
        }
      : null,
    previous: previous
      ? {
          month: previous.month,
          refundRate: rate(previous.refund_amount, previous.revenue),
          roas: roas(previous.ad_revenue, previous.ad_spend),
        }
      : null,
    marketing,
    supportTickets: ticketsRes.data ?? [],
  };
}

export async function getProductMarketingContext(
  supabase: SupabaseClient<Database>,
  scope: StoreScope,
  productId: string,
): Promise<ProductMarketingContext> {
  const { data: roasDef } = await supabase
    .from("metric_definitions")
    .select("default_threshold")
    .eq("organization_id", scope.organizationId)
    .eq("metric_key", "ad_roas")
    .single();

  const series = await getProductSeries(supabase, scope, productId, SERIES_MONTHS);
  const summary: CampaignSummary[] = series
    .filter((point) => point.ad_spend > 0)
    .slice(-SERIES_MONTHS)
    .map((point) => ({
      campaign: point.month,
      spend_gbp: Math.round(point.ad_spend),
      revenue_gbp: Math.round(point.ad_revenue),
      roas: Number((point.ad_revenue / point.ad_spend).toFixed(2)),
    }));
  const roasAlarm = Number(roasDef?.default_threshold ?? 1.5);

  return {
    product_id: productId,
    roas_alarm: roasAlarm,
    campaign_summary: summary,
    low_roas_campaigns: summary.filter((campaign) => campaign.roas < roasAlarm),
  };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoney(value: number): string {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatRoas(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

export function formatProductDeepContext(context: ProductDeepContext): string {
  if (!context.latest) {
    return `Deep product context (${context.productId}): no monthly return/marketing series available.`;
  }

  const lines = [
    `Deep product context (${context.productId}):`,
    `- latest month ${context.latest.month}: refund rate ${formatPercent(context.latest.refundRate)} (${formatMoney(context.latest.refundAmount)}, ${context.latest.refundCount} refunds), ROAS ${formatRoas(context.latest.roas)} (${formatMoney(context.latest.adSpend)} spend -> ${formatMoney(context.latest.adRevenue)} revenue)`,
  ];

  if (context.previous) {
    lines.push(
      `- previous month ${context.previous.month}: refund rate ${formatPercent(context.previous.refundRate)}, ROAS ${formatRoas(context.previous.roas)}`,
    );
  }

  if (context.marketing.campaign_summary.length > 0) {
    const lowRoas = context.marketing.low_roas_campaigns.length;
    lines.push(
      `- marketing: ${context.marketing.campaign_summary.length} recent month(s), ${lowRoas} below ROAS alarm ${context.marketing.roas_alarm}`,
    );
  }

  if (context.supportTickets.length > 0) {
    lines.push(`- support tickets (${context.supportTickets.length}):`);
    lines.push(
      ...context.supportTickets.map(
        (ticket) =>
          `  - ${ticket.subject ?? "(no subject)"} [${ticket.status ?? "unknown"}, ${ticket.priority ?? "normal"}, ${ticket.category ?? "uncategorized"}]`,
      ),
    );
  } else {
    lines.push("- support tickets: none linked to this product");
  }

  return lines.join("\n");
}
