/**
 * Server-side data helpers — query Supabase fit_scores table.
 * These run only in Route Handlers / Server Components (Node.js runtime).
 */

import { createClient } from "@/utils/supabase/server";

export interface ProductSummaryRow {
  product_id: string;
  title: string;
  product_type: string;
  gender_segment: string;
  price: number;
  colours: string[];
  colour_hexes: string[];
  sizing_return_rate: number;
  fit_score: "A" | "B" | "C" | "D" | "F";
  size_bias: "runs_small" | "runs_large" | "true_to_size" | "unknown";
  stockout_count: number;
  demo_order: number;
}

export interface ProductDetailRow extends ProductSummaryRow {
  size_too_small: number;
  size_too_large: number;
  total_sizing_refunds: number;
  units_sold: number;
  inventory_by_size: Record<string, number>;
  stockout_sizes: string[];
}

// Demo order for storefront
const DEMO_ORDER = [
  "prod_00005",
  "prod_00026",
  "prod_00036",
  "prod_00039",
  "prod_00010",
  "prod_00015",
  "prod_00009",
  "prod_00001",
];

export async function getAllProductsSummary(): Promise<ProductSummaryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fit_scores")
    .select(
      "product_id,title,product_type,gender_segment,price,colours,colour_hexes," +
      "sizing_return_rate,fit_score,size_bias,stockout_count,demo_order",
    )
    .order("demo_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProductSummaryRow[];
}

export async function getProductDetail(productId: string): Promise<ProductDetailRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fit_scores")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(error.message);
  }
  return data as ProductDetailRow;
}

export async function getAllFitScores(): Promise<ProductDetailRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fit_scores")
    .select("*")
    .order("sizing_return_rate", { ascending: false });

  if (error) throw new Error(error.message);

  // Sort F → D → C → B → A (match original Python ordering)
  const gradeOrder: Record<string, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };
  return ((data ?? []) as ProductDetailRow[]).sort(
    (a, b) =>
      gradeOrder[a.fit_score] - gradeOrder[b.fit_score] ||
      b.sizing_return_rate - a.sizing_return_rate,
  );
}
