import { Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KpiThreshold } from "@/lib/catalog";

// "Hugo is watching this product" — the per-product monitor (design: product.jsx).
export default function AgentMonitor({ kpis }: { kpis: KpiThreshold[] }) {
  const count = kpis.length;
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">Hugo is watching this product</div>
          <div className="text-[11px] text-muted-foreground">
            {count} KPI{count === 1 ? "" : "s"} · alerts you the moment one breaks
          </div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-sev-resolved">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-sev-resolved/50" />
            <span className="relative inline-flex size-2 rounded-full bg-sev-resolved" />
          </span>
          Live
        </span>
      </div>
      {count > 0 ? (
        <ul className="divide-y divide-border">
          {kpis.map((t) => (
            <li key={`${t.metric_key}-${t.id}`} className="flex items-center gap-3 px-4 py-2.5">
              <span className="size-1.5 shrink-0 rounded-full bg-sev-resolved" />
              <span className="flex-1 text-[13px] capitalize text-foreground">
                {t.metric_key.replace(/_/g, " ")}
              </span>
              <span className="tabnum text-[11px] text-muted-foreground">
                {t.direction === "below" ? "≥" : "≤"} {t.threshold}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
          No product-specific thresholds. Using catalog defaults.
        </p>
      )}
    </Card>
  );
}
