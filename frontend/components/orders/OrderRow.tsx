import type { OrderFeedItem } from "@/lib/orders/types";

const STATUS_COLOR: Record<string, string> = {
  paid: "text-green-400",
  pending: "text-yellow-400",
  refunded: "text-red-400",
  partially_refunded: "text-orange-400",
  voided: "text-zinc-400",
};

function statusColor(status: string | null): string {
  return STATUS_COLOR[(status ?? "").toLowerCase()] ?? "text-zinc-400";
}

function stamp(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/London" });
  const time = d.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Europe/London" });
  return `${day} ${time}`;
}

export function OrderRow({ order }: { order: OrderFeedItem }) {
  const items = order.items.length
    ? order.items.map((i) => `${i.title} ×${i.quantity}`).join(", ")
    : "—";
  return (
    <div className="flex items-center gap-3 border-b border-border/50 px-3 py-1.5 font-mono text-xs">
      <span className="shrink-0 tabular-nums text-muted-foreground">{stamp(order.created_at)}</span>
      <span className="shrink-0 text-muted-foreground">#{order.order_number ?? order.order_id.slice(-6)}</span>
      <span className="min-w-0 flex-1 truncate text-foreground">{items}</span>
      <span className="shrink-0 tabular-nums font-medium">
        £{Math.round(order.total_price).toLocaleString("en-GB")}
      </span>
      <span className="hidden w-7 shrink-0 text-muted-foreground sm:inline">{order.country ?? "—"}</span>
      <span className={`shrink-0 ${statusColor(order.financial_status)}`}>● {order.financial_status ?? "—"}</span>
    </div>
  );
}
