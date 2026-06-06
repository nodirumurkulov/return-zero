import Link from "next/link";
import { notFound } from "next/navigation";
import LinkedIncidents from "@/components/catalog/LinkedIncidents";
import { HealthBadge } from "@/components/catalog/HealthBadge";
import KpiCard from "@/components/catalog/KpiCard";
import ThresholdEditor from "@/components/catalog/ThresholdEditor";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { requireOrganizationId } from "@/lib/organizations/queries";
import { getStore } from "@/lib/stores/server";
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
  const store = getStore(supabase);
  const [detail, linkedIncidents] = await Promise.all([
    store.catalog.get({ organizationId, productId: params.productId }),
    store.incidents.listByProduct({ organizationId, productId: params.productId }),
  ]);

  if (!detail) notFound();

  const { product, monthly: monthlyRows, thresholds: thresholdRows } = detail;
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
            <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
            <HealthBadge level={product.health} />
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground">
            {product.product_type} · {product.gender_segment} · {product.product_id}
          </p>
        </div>
      </div>

      <SectionLabel>30-day KPIs</SectionLabel>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Return rate"
          value={`${((product.return_rate ?? 0) * 100).toFixed(1)}%`}
          subtext={rateTrendSubtext(returnTrend, "Return rate")}
          trend={returnTrend}
          accent={(product.return_rate ?? 0) > 0.2 ? "danger" : "default"}
        />
        <KpiCard
          label="Refund rate"
          value={`${((product.refund_rate ?? 0) * 100).toFixed(1)}%`}
          subtext="Share of revenue refunded"
          trend={returnTrend}
          accent={(product.refund_rate ?? 0) > 0.12 ? "danger" : "default"}
        />
        <KpiCard
          label="Revenue (30d)"
          value={`£${Number(product.revenue_gbp ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
          subtext={`${product.order_count ?? 0} orders`}
          trend={revenueTrend}
        />
        <KpiCard
          label="Support tickets"
          value={String(product.support_tickets ?? 0)}
          subtext={
            product.ad_roas != null ? `Ad ROAS ${product.ad_roas.toFixed(1)}x` : "No ad attribution"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <LinkedIncidents incidents={linkedIncidents} />
        <ThresholdEditor productId={params.productId} thresholds={thresholdRows} />
      </div>
    </div>
  );
}
