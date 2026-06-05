export type EcommercePlatform = "shopify" | "woocommerce" | "other";
export type PrimaryGoal = "growth" | "margin" | "cash";

export interface BusinessProfile {
  platform: EcommercePlatform;
  storeName: string;
  primaryGoal: PrimaryGoal;
  targetMarginPct: number;
  minRoas: number;
  leadTimeDays: number;
  bufferDays: number;
  heroProductIds: string[];
}

export interface ProductCostRow {
  productId: string;
  title: string;
  defaultCost: number | null;
  costPerUnit: number;
}

export interface BusinessProfilePayload extends BusinessProfile {
  productCosts: { productId: string; costPerUnit: number }[];
}
