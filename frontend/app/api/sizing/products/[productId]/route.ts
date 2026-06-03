import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } },
) {
  try {
    const product = await getProductDetail(params.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${params.productId} not found` },
        { status: 404 },
      );
    }
    return NextResponse.json(product);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
