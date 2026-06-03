// Routes are served by Next.js Route Handlers — no separate backend needed.
// In the browser, relative paths work fine. From Node (server component / test),
// we need an absolute URL, which NEXT_PUBLIC_SITE_URL provides on Vercel.
const API = (typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  : "");

export interface ProductSummary {
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
}

export interface ProductDetail extends ProductSummary {
  size_too_small: number;
  size_too_large: number;
  total_sizing_refunds: number;
  units_sold: number;
  inventory_by_size: Record<string, number>;
  stockout_sizes: string[];
}

export interface FitScore {
  product_id: string;
  title: string;
  product_type: string;
  gender_segment: string;
  sizing_return_rate: number;
  fit_score: "A" | "B" | "C" | "D" | "F";
  size_bias: string;
  size_too_small: number;
  size_too_large: number;
  units_sold: number;
  stockout_sizes: string[];
  inventory_by_size: Record<string, number>;
}

export async function fetchProducts(): Promise<ProductSummary[]> {
  const res = await fetch(`${API}/api/sizing/products`, { cache: "no-store" });
  return res.json();
}

export async function fetchProduct(id: string): Promise<ProductDetail> {
  const res = await fetch(`${API}/api/sizing/products/${id}`, { cache: "no-store" });
  return res.json();
}

export async function fetchFitScores(): Promise<FitScore[]> {
  const res = await fetch(`${API}/api/fitscores`, { cache: "no-store" });
  return res.json();
}

export async function fetchRecommendation(id: string): Promise<string> {
  const res = await fetch(`${API}/api/fitscores/${id}/recommendation`, { cache: "no-store" });
  const data = await res.json();
  return data.recommendation ?? "";
}

export async function sendSizingMessage(
  messages: { role: string; content: string }[],
  product_id: string
): Promise<string> {
  const res = await fetch(`${API}/api/sizing/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, product_id }),
  });
  const data = await res.json();
  return data.reply ?? "";
}
