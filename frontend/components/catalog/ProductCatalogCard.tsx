import Link from "next/link";
import { HealthBadge } from "@/components/catalog/HealthBadge";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthLevel, ProductMetric } from "@/lib/catalog";

type ProductCatalogCardProps = {
  product: ProductMetric;
  health: HealthLevel;
};

function formatPct(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default function ProductCatalogCard({ product, health }: ProductCatalogCardProps) {
  return (
    <Link href={`/catalog/${product.product_id}`}>
      <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-pop">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium leading-snug group-hover:text-primary">
                {product.title}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {product.product_type} · {product.gender_segment}
              </p>
            </div>
            <HealthBadge level={health} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Return rate</p>
              <p className="font-mono text-sm">{formatPct(product.return_rate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Revenue (30d)</p>
              <p className="font-mono text-sm">
                £{Number(product.revenue_gbp ?? 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Refund rate</p>
              <p className="font-mono text-sm">{formatPct(product.refund_rate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Support</p>
              <p className="font-mono text-sm">{product.support_tickets ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
