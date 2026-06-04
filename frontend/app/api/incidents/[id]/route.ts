import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();

  const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
    supabase.from("incidents").select("*").eq("id", params.id).single(),
    supabase
      .from("agent_findings")
      .select("*")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("incident_actions")
      .select("*")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("incident_timeline")
      .select("*")
      .eq("incident_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  if (incidentRes.error) {
    return NextResponse.json({ error: incidentRes.error.message }, { status: 404 });
  }

  return NextResponse.json({
    incident: incidentRes.data,
    findings: findingsRes.data ?? [],
    actions: actionsRes.data ?? [],
    timeline: timelineRes.data ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const body = await req.json() as Record<string, unknown>;

  const { data, error } = await supabase
    .from("incidents")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
