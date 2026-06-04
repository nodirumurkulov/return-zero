import { type NextRequest, NextResponse } from "next/server";
import { runAndPersistInvestigation } from "@/lib/agents/investigate";
import { investigateBodySchema } from "@/lib/agents/schemas";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Auth: protected by Clerk middleware (proxy.ts) — unauthenticated requests to
// /api/* receive a JSON 401 before reaching this handler.
export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = investigateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  try {
    const summary = await runAndPersistInvestigation(supabase, parsed.data);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
