import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { OrderFeedItem } from "@/lib/orders/types";

const STATUS_TONE: Record<string, string> = {
  paid: "text-sev-resolved bg-sev-resolvedBg",
  pending: "text-sev-monitor bg-sev-monitorBg",
  processing: "text-sev-monitor bg-sev-monitorBg",
  refunded: "text-sev-critical bg-sev-criticalBg",
  partially_refunded: "text-sev-high bg-sev-highBg",
  voided: "text-zinc-500 bg-zinc-100",
};

function tone(status: string | null): string {
  return STATUS_TONE[(status ?? "").toLowerCase()] ?? "text-zinc-500 bg-zinc-100";
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false, timeZone: "Europe/London" });
}
function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "Europe/London" });
}

export function OrderRow({ order }: { order: OrderFeedItem }) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const items = order.items.length
    ? order.items.map((i) => `${i.title}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")
    : "—";
  return (
    <div className="flex items-center gap-4 px-5 py-2.5 transition-colors hover:bg-muted/40">
      <span className="tabnum w-[84px] shrink-0 font-mono text-xs text-muted-foreground">
        #{order.order_number ?? order.order_id.slice(-6)}
      </span>
      <div className="flex w-[116px] shrink-0 items-center gap-2">
        <Avatar className="size-6">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="size-3.5" />
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-[13px] text-foreground">{order.country ?? "—"}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-foreground">{items}</div>
        <div className="text-[11px] text-muted-foreground">
          {units} item{units === 1 ? "" : "s"}
        </div>
      </div>
      <span className="hidden w-[110px] shrink-0 truncate text-xs text-muted-foreground lg:block">
        {order.utm_campaign ?? "direct"}
      </span>
      <span
        className={`hidden w-[92px] shrink-0 rounded-md px-2 py-0.5 text-center text-[11px] font-medium capitalize md:inline-block ${tone(order.financial_status)}`}
      >
        {(order.financial_status ?? "—").replace(/_/g, " ")}
      </span>
      <span className="tabnum w-[72px] shrink-0 text-right text-sm font-semibold text-foreground">
        £{Math.round(order.total_price).toLocaleString("en-GB")}
      </span>
      <span className="tabnum hidden w-[116px] shrink-0 text-right text-[11px] text-muted-foreground sm:block">
        {dayOf(order.created_at)} {timeOf(order.created_at)}
      </span>
    </div>
  );
}
