import { NextResponse } from "next/server";
import { getAllProductsSummary } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getAllProductsSummary();
    return NextResponse.json(products);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
