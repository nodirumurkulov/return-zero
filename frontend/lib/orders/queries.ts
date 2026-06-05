import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderFeedItem, OrderFeedLineItem } from "./types";

// The next batch of orders that "arrive" after a timestamp, in arrival order.
// One orders query + a grouped line_items fetch (line_items already carries the
// product title — no products join) + customer country. Mirrors the .in()
// grouping pattern in lib/agents/product-orders.ts.
export async function listIncomingOrders(
  supabase: SupabaseClient,
  opts: { after: string; limit?: number },
): Promise<OrderFeedItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select(
      "order_id, order_number, created_at, total_price, financial_status, utm_campaign, customer_id",
    )
    .gt("created_at", opts.after)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`orders feed failed: ${error.message}`);

  const orders = orderRows ?? [];
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.order_id as string);
  const customerIds = [
    ...new Set(
      orders.map((o) => o.customer_id).filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const itemsPromise = supabase
    .from("line_items")
    .select("order_id, title, quantity, price")
    .in("order_id", orderIds);
  const customersPromise = customerIds.length
    ? supabase.from("customers").select("customer_id, default_country").in("customer_id", customerIds)
    : null;

  const [itemsRes, custRes] = await Promise.all([itemsPromise, customersPromise]);

  const itemsByOrder = new Map<string, OrderFeedLineItem[]>();
  for (const r of itemsRes.data ?? []) {
    const list = itemsByOrder.get(r.order_id as string) ?? [];
    list.push({
      title: String(r.title ?? "Item"),
      quantity: Number(r.quantity ?? 0),
      price: Number(r.price ?? 0),
    });
    itemsByOrder.set(r.order_id as string, list);
  }

  const countryByCustomer = new Map(
    (custRes?.data ?? []).map((c) => [c.customer_id as string, (c.default_country as string | null) ?? null]),
  );

  return orders.map((o) => ({
    order_id: o.order_id as string,
    order_number: (o.order_number as string | null) ?? null,
    created_at: String(o.created_at),
    total_price: Number(o.total_price ?? 0),
    financial_status: (o.financial_status as string | null) ?? null,
    utm_campaign: (o.utm_campaign as string | null) ?? null,
    country: o.customer_id ? (countryByCustomer.get(o.customer_id as string) ?? null) : null,
    items: itemsByOrder.get(o.order_id as string) ?? [],
  }));
}
