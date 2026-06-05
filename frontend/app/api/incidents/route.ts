import { NextResponse } from "next/server";
import { apiErrorResponse, logApiError } from "@/lib/api-errors";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err) {
    logApiError("api/incidents", err);
    return apiErrorResponse(err);
  }
}
