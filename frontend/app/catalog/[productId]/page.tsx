import Link from "next/link";
import { notFound } from "next/navigation";
import AgentMonitor from "@/components/catalog/AgentMonitor";
import { HealthBadge } from "@/components/catalog/HealthBadge";
import KpiCard from "@/components/catalog/KpiCard";
import ThresholdEditor from "@/components/catalog/ThresholdEditor";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { computeProductHealth, getProductCatalogDetail } from "@/lib/catalog";
import { requireOrganizationId } from "@/lib/organizations/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function rateTrendSubtext(trend: number[], label: string): string | undefined {
  if (trend.length < 2) return undefined;
  const first = trend[0];
  const last = trend[trend.length - 1];
  const delta = last - first;
  if (Math.abs(delta) < 0.002) return `${label} holding steady`;
  const pts = (Math.abs(delta) * 100).toFixed(1);
  return delta > 0 ? `${label} up ${pts} pts over window` : `${label} down ${pts} pts over window`;
}

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();
  const organizationId = await requireOrganizationId(supabase);
  const detail = await getProductCatalogDetail(supabase, organizationId, params.productId);

  if (!detail) notFound();

  const { product: metrics, monthly: monthlyRows, thresholds: thresholdRows } = detail;
  const health = computeProductHealth(metrics, thresholdRows);
  const returnTrend = monthlyRows.map((row) => Number(row.return_rate ?? 0));
  const revenueTrend = monthlyRows.map((row) => Number(row.revenue_gbp ?? 0));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 px-0">
            <Link href="/catalog">← Back to catalog</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{metrics.title}</h1>
            <HealthBadge level={health} />
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {metrics.product_type} · {metrics.gender_segment} · {metrics.product_id}
          </p>
        </div>
      </div>

      <SectionLabel>30-day KPIs</SectionLabel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Return rate"
          value={`${((metrics.return_rate ?? 0) * 100).toFixed(1)}%`}
          subtext={rateTrendSubtext(returnTrend, "Return rate")}
          trend={returnTrend}
          accent={(metrics.return_rate ?? 0) > 0.2 ? "danger" : "default"}
        />
        <KpiCard
          label="Refund rate"
          value={`${((metrics.refund_rate ?? 0) * 100).toFixed(1)}%`}
          subtext="Share of revenue refunded"
          trend={returnTrend}
          accent={(metrics.refund_rate ?? 0) > 0.12 ? "danger" : "default"}
        />
        <KpiCard
          label="Revenue (30d)"
          value={`£${Number(metrics.revenue_gbp ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
          subtext={`${metrics.order_count ?? 0} orders`}
          trend={revenueTrend}
        />
        <KpiCard
          label="Support tickets"
          value={String(metrics.support_tickets ?? 0)}
          subtext={
            metrics.ad_roas != null ? `Ad ROAS ${metrics.ad_roas.toFixed(1)}x` : "No ad attribution"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AgentMonitor kpis={thresholdRows} />
        <ThresholdEditor productId={params.productId} thresholds={thresholdRows} />
      </div>
    </div>
  );
}
