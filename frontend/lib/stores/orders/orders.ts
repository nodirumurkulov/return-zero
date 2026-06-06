import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { Incidents } from "../incidents";
import { mergeDetectionResults } from "../incidents/types";
import { OrdersError } from "./errors";
import type {
  OrderFeedItem,
  OrderFeedLineItem,
  OrdersAdvanceOpts,
  OrdersAdvanceResult,
  OrdersBoundsOpts,
  OrdersListOpts,
  OrdersResetOpts,
} from "./types";

const DEFAULT_ADVANCE_DAYS = 7;

export class Orders {
  // Fallback when uploaded data has no orders.
  private static readonly REPLAY_START = "2025-12-01";
  private static readonly STREAM_WINDOW_MONTHS = 3;

  static readonly STREAM_START_FALLBACK = Orders.REPLAY_START;

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
      this.#readReplayCursor(opts.organizationId),
      this.#dataEndDate(opts.organizationId),
      this.#streamStartDate(opts.organizationId),
    ]);
    return {
      cursor,
      streamStart: streamStart ?? Orders.REPLAY_START,
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
    if (error) throw new OrdersError(`orders feed failed: ${error.message}`);

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

    const end = await this.#dataEndDate(opts.organizationId);
    const start = this.#streamStartFromEnd(end);
    const previous = (await this.#readReplayCursor(opts.organizationId)) ?? start;

    const { cursor, at_end } = this.#advanceReplayCursor({
      previous,
      advanceDays: days,
      end,
    });

    await this.#writeReplayCursor(opts.organizationId, cursor);

    const { data: products, error: prodErr } = await this.supabase
      .from("products")
      .select("id")
      .eq("organization_id", opts.organizationId);
    if (prodErr) throw new OrdersError(`load products failed: ${prodErr.message}`);

    const breaches = mergeDetectionResults(
      await Promise.all(
        (products ?? []).map((p) =>
          this.incidents.detect({
            organizationId: opts.organizationId,
            productId: p.id,
            asOf: cursor,
          }),
        ),
      ),
    );

    return {
      previous_cursor: previous,
      cursor,
      at_end,
      breaches,
    };
  }

  async reset(opts: OrdersResetOpts): Promise<{ cursor: string }> {
    const cursor =
      (await this.#streamStartDate(opts.organizationId)) ?? Orders.REPLAY_START;
    await this.#writeReplayCursor(opts.organizationId, cursor);
    return { cursor };
  }

  #asDate(value: string): string {
    return value.slice(0, 10);
  }

  async #readReplayCursor(organizationId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from("store_connections")
      .select("replay_cursor")
      .eq("organization_id", organizationId)
      .maybeSingle();
    return data?.replay_cursor ? this.#asDate(String(data.replay_cursor)) : null;
  }

  async #writeReplayCursor(organizationId: string, cursor: string): Promise<void> {
    const { error } = await this.supabase
      .from("store_connections")
      .update({ replay_cursor: cursor, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId);
    if (error) {
      throw new OrdersError(`store_connections replay_cursor update failed: ${error.message}`);
    }
  }

  async #dataEndDate(organizationId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from("orders")
      .select("created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.created_at ? this.#asDate(String(data.created_at)) : null;
  }

  async #streamStartDate(organizationId: string): Promise<string | null> {
    const end = await this.#dataEndDate(organizationId);
    return end ? this.#minusMonths(end, Orders.STREAM_WINDOW_MONTHS) : null;
  }

  #streamStartFromEnd(end: string | null): string {
    return end ? this.#minusMonths(end, Orders.STREAM_WINDOW_MONTHS) : Orders.REPLAY_START;
  }

  #advanceReplayCursor(opts: {
    previous: string;
    advanceDays: number;
    end: string | null;
  }): { cursor: string; at_end: boolean } {
    const advanced = this.#addDays(opts.previous, opts.advanceDays);
    const cursor = opts.end && advanced > opts.end ? opts.end : advanced;
    return {
      cursor,
      at_end: Boolean(opts.end) && cursor >= opts.end!,
    };
  }

  #addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  #minusMonths(iso: string, months: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - months);
    return d.toISOString().slice(0, 10);
  }
}
