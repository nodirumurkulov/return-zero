import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/supabase-data";
import { chatWithTools } from "@/lib/llm";

export const dynamic = "force-dynamic";

interface ChatMessage { role: string; content: string }
interface ChatRequest  { messages: ChatMessage[]; product_id: string }

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, product_id } = body;
  if (!product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const detail = await getProductDetail(product_id);
  if (!detail) {
    return NextResponse.json({ error: `Product ${product_id} not found` }, { status: 404 });
  }

  const biasLine: Record<string, string> = {
    runs_small:   `it runs small (${detail.size_too_small} customers returned it for being too small vs ${detail.size_too_large} too large)`,
    runs_large:   `it runs large (${detail.size_too_large} customers returned it for being too large vs ${detail.size_too_small} too small)`,
    true_to_size: "it is true to size",
    unknown:      "the sizing pattern is unclear from return data",
  };

  const stockoutLine = detail.stockout_sizes?.length
    ? `These sizes are currently out of stock: ${detail.stockout_sizes.join(", ")}.`
    : "";

  const system =
    `You are the sizing assistant for Pretty Fly, a premium London streetwear brand.\n` +
    `You help customers find their correct size before ordering — before they make an expensive mistake.\n\n` +
    `Current product: ${detail.title} (product_id: ${product_id})\n` +
    `Sizing return rate: ${detail.sizing_return_rate}% — ${detail.sizing_return_rate > 10 ? "high, needs careful guidance" : "low, fairly true to size"}\n` +
    `Direction: ${biasLine[detail.size_bias] ?? "the sizing pattern is unclear"}.\n` +
    `${stockoutLine}\n\n` +
    `You have access to the get_product_sizing tool for exact data. Always call it before answering.\n\n` +
    `Rules:\n` +
    `- Be specific: cite the actual return rate and customer counts\n` +
    `- Be brief: 2–3 sentences maximum\n` +
    `- Be direct: give a clear size recommendation, not a hedge\n` +
    `- Reference real numbers: "501 customers found this ran small" beats "it tends to run small"\n` +
    `- If a size is out of stock, mention it\n` +
    `- Never say "I don't know" — you have the data, use it`;

  try {
    const reply = await chatWithTools(messages, system, product_id);
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LLM error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
