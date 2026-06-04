import Link from "next/link";
import { notFound } from "next/navigation";
import HealthBadge from "@/components/catalog/HealthBadge";
import KpiCard from "@/components/catalog/KpiCard";
import ThresholdEditor from "@/components/catalog/ThresholdEditor";
import { Button } from "@/components/ui/button";
import SectionLabel from "@/components/ui/section-label";
import { getCatalogProduct } from "@/lib/metrics/catalog";
import { getProductSeries } from "@/lib/metrics/series";
import type { MetricValue } from "@/lib/metrics/types";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ productId: string }>;
};

function accentFor(metrics: MetricValue[], key: string): "default" | "danger" {
  const status = metrics.find((m) => m.metric_key === key)?.status;
  return status === "critical" || status === "warning" ? "danger" : "default";
}

export default async function ProductDetailPage(props: PageProps) {
  const params = await props.params;
  const supabase = createServiceClient();
  const { productId } = params;

  const [product, series] = await Promise.all([
    getCatalogProduct(supabase, productId),
    getProductSeries(supabase, productId, 12),
  ]);

  if (!product) notFound();

  const returnTrend = series.map((p) => (p.units > 0 ? p.refund_count / p.units : 0));
  const revenueTrend = series.map((p) => p.revenue);

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
          subtext="Refunded units / units sold"
          trend={returnTrend}
          accent={accentFor(product.metrics, "return_rate")}
        />
        <KpiCard
          label="Refund rate"
          value={`${((product.refund_rate ?? 0) * 100).toFixed(1)}%`}
          subtext="Share of revenue refunded"
          trend={returnTrend}
          accent={accentFor(product.metrics, "refund_rate")}
        />
        <KpiCard
          label="Revenue (30d)"
          value={`£${product.revenue_gbp.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`}
          subtext={`${Math.round(product.units)} units`}
          trend={revenueTrend}
        />
        <KpiCard
          label="Support tickets"
          value={String(Math.round(product.support_tickets))}
          subtext={
            product.ad_roas != null ? `Ad ROAS ${product.ad_roas.toFixed(1)}x` : "No ad attribution"
          }
          accent={accentFor(product.metrics, "support_volume")}
        />
      </div>

      <ThresholdEditor productId={productId} metrics={product.metrics} />
    </div>
  );
}
