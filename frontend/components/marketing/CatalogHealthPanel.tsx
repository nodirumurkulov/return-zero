import { HealthBadge } from "@/components/catalog/HealthBadge";
import { SectionLabel } from "@/components/ui/section-label";
import type { HealthLevel, ProductMetric } from "@/lib/stores";

function formatPct(value: number | null) {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

export function CatalogHealthPanel({
  product,
  health,
}: {
  product: ProductMetric;
  health: HealthLevel;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Catalog health</SectionLabel>
          <p className="mt-1 text-sm font-medium leading-snug">{product.title}</p>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {product.product_type} · {product.gender_segment}
          </p>
        </div>
        <HealthBadge level={health} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Return rate</p>
          <p className="font-mono text-sm tabnum">{formatPct(product.return_rate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">ROAS</p>
          <p className="font-mono text-sm tabnum">{product.ad_roas?.toFixed(2) ?? "N/A"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Refund rate</p>
          <p className="font-mono text-sm tabnum">{formatPct(product.refund_rate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Support (30d)</p>
          <p className="font-mono text-sm tabnum">{product.support_tickets ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
