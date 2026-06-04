import { type NextRequest, NextResponse } from "next/server";
import { runInvestigation } from "@/lib/agents";
import { investigateBodySchema } from "@/lib/agents/schemas";
import { sendIncidentNotification } from "@/lib/slack";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = investigateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") || "Invalid request body" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { incident_id, product_id } = parsed.data;

  await supabase
    .from("incidents")
    .update({ status: "investigating", investigation_started_at: new Date().toISOString() })
    .eq("id", incident_id);

  await supabase.from("incident_timeline").insert({
    incident_id,
    event_type: "agent_assigned",
    description: "4 agents dispatched in parallel: Returns, Merchandising, Marketing, Inventory",
  });

  try {
    const result = await runInvestigation(supabase, incident_id, product_id);

    await supabase.from("agent_findings").insert(
      result.findings.map((f) => ({
        incident_id,
        agent_name: f.agent_name,
        agent_icon: f.agent_icon,
        summary: f.summary,
        detail: f.detail as Json,
      })),
    );

    await supabase.from("incident_actions").insert(
      result.actions.map((a) => ({
        incident_id,
        title: a.title,
        description: a.description,
        impact_level: a.impact_level,
        risk_level: a.risk_level,
        auto_deploy: a.auto_deploy,
        status: "proposed",
      })),
    );

    const now = new Date().toISOString();
    await supabase
      .from("incidents")
      .update({
        status: "fix_proposed",
        root_cause: result.root_cause,
        root_cause_confidence: result.root_cause_confidence,
        fix_proposed_at: now,
      })
      .eq("id", incident_id);

    await supabase.from("incident_timeline").insert([
      {
        incident_id,
        event_type: "root_cause_found",
        description: `Root cause identified with ${result.root_cause_confidence}% confidence`,
        metadata: { confidence: result.root_cause_confidence },
      },
      {
        incident_id,
        event_type: "action_proposed",
        description: `${result.actions.length} actions proposed`,
      },
    ]);

    const autoActions = result.actions.filter((a) => a.auto_deploy);
    if (autoActions.length > 0) {
      const { data: storedActions } = await supabase
        .from("incident_actions")
        .select("id, auto_deploy")
        .eq("incident_id", incident_id)
        .eq("auto_deploy", true);

      if (storedActions?.length) {
        const ids = storedActions.map((a) => a.id);
        await supabase
          .from("incident_actions")
          .update({
            status: "deployed",
            deployed_at: now,
          })
          .in("id", ids);

        await supabase.from("incident_timeline").insert({
          incident_id,
          event_type: "deployed",
          description: `${ids.length} low-risk action(s) auto-deployed`,
        });
      }
    }

    const { data: incident } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", incident_id)
      .single();

    if (incident) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendIncidentNotification({
        title: incident.title,
        severity: incident.severity,
        status: "fix_proposed",
        impact_amount: incident.impact_amount,
        impact_label: incident.impact_label,
        root_cause: result.root_cause,
        root_cause_confidence: result.root_cause_confidence,
        actions: result.actions,
        incident_id,
        app_url: appUrl,
      });
    }

    return NextResponse.json({
      success: true,
      root_cause: result.root_cause,
      root_cause_confidence: result.root_cause_confidence,
      findings_count: result.findings.length,
      actions_count: result.actions.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("incidents").update({ status: "detected" }).eq("id", incident_id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
