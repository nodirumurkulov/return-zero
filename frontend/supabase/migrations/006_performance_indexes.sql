-- =============================================================
-- 006_performance_indexes.sql  (RUN-13)
-- Indexes for the analytics hot paths — chiefly product_source_facts(), which
-- breach detection (RUN-20) calls repeatedly, plus the incident dedup lookup.
--
-- Note: the issue named orders.created_at, refunds.product_id, line_items.product_id.
-- `refunds` has no product_id (it links via order_id + the refund_line_items
-- variant array), so we index the join/filter keys the queries actually use.
-- =============================================================

-- sales: orders x line_items, windowed by orders.created_at
create index if not exists idx_orders_created_at      on orders (created_at);
create index if not exists idx_line_items_order_id     on line_items (order_id);
create index if not exists idx_line_items_product_id   on line_items (product_id);

-- ad attribution: orders.utm_campaign -> campaign spend by date
create index if not exists idx_orders_utm_campaign     on orders (utm_campaign);
create index if not exists idx_gads_date               on google_ads_daily (date);
create index if not exists idx_meta_date               on meta_ads_daily (date);

-- refunds: windowed by created_at, joined back via order_id
create index if not exists idx_refunds_created_at      on refunds (created_at);
create index if not exists idx_refunds_order_id        on refunds (order_id);

-- support: per-product ticket counts
create index if not exists idx_support_related_product on support_tickets (related_product_id);

-- incident dedup: open incident lookup by product
create index if not exists idx_incidents_product_status on incidents (affected_product, status);
