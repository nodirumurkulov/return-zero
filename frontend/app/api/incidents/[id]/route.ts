import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

// Fields a client is allowed to PATCH on an incident. Anything else in the body
// is ignored, so a crafted request can't overwrite ids/timestamps/etc.
const INCIDENT_PATCHABLE_FIELDS = [
  "status",
  "severity",
  "title",
  "root_cause",
  "resolved_at",
] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

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
  const unauthorized = await requireUser();
  if (unauthorized) return unauthorized;

  const supabase = createServiceClient();
  const body = (await req.json()) as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  for (const field of INCIDENT_PATCHABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No updatable fields provided" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
