import { NextResponse } from "next/server";
import { getAllFitScores } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scores = await getAllFitScores();
    return NextResponse.json(scores);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
