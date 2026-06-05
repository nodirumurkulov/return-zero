/** One month of a product time series (from product_monthly_series RPC). */
export interface MonthlyPoint {
  product_id: string;
  month: string;
  units: number;
  revenue: number;
  refund_amount: number;
  refund_count: number;
  ad_spend: number;
  ad_revenue: number;
}

export interface SeriesOpts {
  organizationId: string;
  productId?: string;
  months?: number;
}
