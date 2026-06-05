import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

import type { OrderFeedItem, OrderFeedLineItem } from "./order-feed-item";

export const ordersQuerySchema = z.object({
  after: z.string().min(1),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

// The next batch of orders that "arrive" after a timestamp, in arrival order.
export async function listIncomingOrders(
  supabase: SupabaseClient<Database>,
  opts: { organizationId: string; after: string; limit?: number },
): Promise<OrderFeedItem[]> {
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, total_price, financial_status, utm_campaign, customer_id",
    )
    .eq("organization_id", opts.organizationId)
    .gt("created_at", opts.after)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`orders feed failed: ${error.message}`);

  const orders = orderRows ?? [];
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const customerIds = [
    ...new Set(orders.map((o) => o.customer_id).filter((id): id is string => id != null)),
  ];

  const itemsPromise = supabase
    .from("line_items")
    .select("order_id, title, quantity, price")
    .eq("organization_id", opts.organizationId)
    .in("order_id", orderIds);
  const customersPromise = customerIds.length
    ? supabase
        .from("customers")
        .select("id, default_country")
        .eq("organization_id", opts.organizationId)
        .in("id", customerIds)
    : null;

  const [itemsRes, custRes] = await Promise.all([itemsPromise, customersPromise]);

  const itemsByOrder = new Map<string, OrderFeedLineItem[]>();
  for (const r of itemsRes.data ?? []) {
    const list = itemsByOrder.get(r.order_id) ?? [];
    list.push({
      title: r.title ?? "Item",
      quantity: r.quantity ?? 0,
      price: r.price ?? 0,
    });
    itemsByOrder.set(r.order_id, list);
  }

  const countryByCustomer = new Map(
    (custRes?.data ?? []).map((c) => [c.id, c.default_country]),
  );

  return orders.map((o) => ({
    order_id: o.id,
    order_number: o.order_number,
    created_at: o.created_at,
    total_price: o.total_price ?? 0,
    financial_status: o.financial_status,
    utm_campaign: o.utm_campaign,
    country: o.customer_id ? (countryByCustomer.get(o.customer_id) ?? null) : null,
    items: itemsByOrder.get(o.id) ?? [],
  }));
}
