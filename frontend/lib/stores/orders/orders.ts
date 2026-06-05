import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { Incidents } from "../incidents";
import { readReplayCursor, writeReplayCursor } from "./cursor";
import type { OrderFeedItem, OrderFeedLineItem } from "./feed/order-feed-item";
import {
  advanceReplayCursor,
  dataEndDate,
  REPLAY_START,
  streamStartDate,
  streamStartFromEnd,
} from "./replay-bounds";
import type { OrdersAdvanceResult } from "./replay-result";

const DEFAULT_ADVANCE_DAYS = 7;

export type OrdersListOpts = {
  organizationId: string;
  after: string;
  limit?: number;
};

export type OrdersAdvanceOpts = {
  organizationId: string;
  days?: number;
};

export type OrdersBoundsOpts = {
  organizationId: string;
};

export type OrdersResetOpts = {
  organizationId: string;
};

export class Orders {
  static readonly STREAM_START_FALLBACK = REPLAY_START;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly incidents: Incidents,
  ) {}

  async bounds(opts: OrdersBoundsOpts): Promise<{
    cursor: string | null;
    streamStart: string;
    dataEnd: string | null;
  }> {
    const [cursor, dataEnd, streamStart] = await Promise.all([
      readReplayCursor(this.supabase, opts.organizationId),
      dataEndDate(this.supabase, opts.organizationId),
      streamStartDate(this.supabase, opts.organizationId),
    ]);
    return {
      cursor,
      streamStart: streamStart ?? REPLAY_START,
      dataEnd,
    };
  }

  async list(opts: OrdersListOpts): Promise<OrderFeedItem[]> {
    const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);

    const { data: orderRows, error } = await this.supabase
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

    const itemsPromise = this.supabase
      .from("line_items")
      .select("order_id, title, quantity, price")
      .eq("organization_id", opts.organizationId)
      .in("order_id", orderIds);
    const customersPromise = customerIds.length
      ? this.supabase
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

  async advance(opts: OrdersAdvanceOpts): Promise<OrdersAdvanceResult> {
    const days = opts.days ?? DEFAULT_ADVANCE_DAYS;

    const end = await dataEndDate(this.supabase, opts.organizationId);
    const start = streamStartFromEnd(end);
    const previous = (await readReplayCursor(this.supabase, opts.organizationId)) ?? start;

    const { cursor, at_end } = advanceReplayCursor({
      previous,
      advanceDays: days,
      end,
    });

    await writeReplayCursor(this.supabase, opts.organizationId, cursor);

    const breaches = await this.incidents.detect({
      organizationId: opts.organizationId,
      asOf: cursor,
    });

    return {
      previous_cursor: previous,
      cursor,
      at_end,
      breaches,
    };
  }

  async reset(opts: OrdersResetOpts): Promise<{ cursor: string }> {
    const cursor =
      (await streamStartDate(this.supabase, opts.organizationId)) ?? REPLAY_START;
    await writeReplayCursor(this.supabase, opts.organizationId, cursor);
    return { cursor };
  }
}
