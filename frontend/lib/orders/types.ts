// Live orders feed (RUN-85) — one order as it "arrives" in the replay stream.

export interface OrderFeedLineItem {
  title: string;
  quantity: number;
  price: number;
}

export interface OrderFeedItem {
  order_id: string;
  order_number: string | null;
  created_at: string; // UTC timestamp
  total_price: number;
  financial_status: string | null;
  utm_campaign: string | null;
  country: string | null;
  items: OrderFeedLineItem[];
}
