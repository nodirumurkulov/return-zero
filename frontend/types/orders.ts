export interface OrderFeedLineItem {
  title: string;
  quantity: number;
  price: number;
}

export interface OrderFeedItem {
  order_id: string;
  order_number: string | null;
  created_at: string;
  total_price: number;
  financial_status: string | null;
  utm_campaign: string | null;
  country: string | null;
  items: OrderFeedLineItem[];
}
