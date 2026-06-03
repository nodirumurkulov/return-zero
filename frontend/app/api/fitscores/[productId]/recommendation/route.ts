import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/supabase-data";
import { simpleCompletion } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } },
) {
  const product = await getProductDetail(params.productId);
  if (!product || !["F", "D"].includes(product.fit_score)) {
    return NextResponse.json({ product_id: params.productId, recommendation: "" });
  }

  const biasMap: Record<string, string> = {
    runs_small:   `runs small — ${product.size_too_small} customers returned it for being too small vs ${product.size_too_large} too large`,
    runs_large:   `runs large — ${product.size_too_large} customers returned it for being too large vs ${product.size_too_small} too small`,
    true_to_size: "is true to size despite a high overall return rate",
    unknown:      "has an unclear sizing pattern",
  };
  const biasText   = biasMap[product.size_bias] ?? "has an unclear sizing pattern";
  const stockoutStr = product.stockout_sizes?.length
    ? product.stockout_sizes.join(", ")
    : "none";

  const prompt =
    `Pretty Fly product: ${product.title}\n` +
    `Sizing return rate: ${product.sizing_return_rate}%\n` +
    `This product ${biasText}.\n` +
    `Sizes currently out of stock: ${stockoutStr}\n` +
    `Units sold: ${product.units_sold}\n\n` +
    "Write a single sentence (max 20 words) for Pretty Fly's product page that honestly " +
    "communicates the sizing. Start with the product name. Be specific and actionable. " +
    "No marketing language.";

  try {
    const recommendation = await simpleCompletion(prompt, 60);
    return NextResponse.json({ product_id: params.productId, recommendation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LLM error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
