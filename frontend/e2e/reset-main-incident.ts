import { createClient } from "@supabase/supabase-js";
import { MAIN_INCIDENT_ID, STATUS_CHANGE_INCIDENT_ID } from "./constants";
import { requireSupabaseEnv } from "./env";

/** Restore demo incident 1 action rows after approve E2E tests mutate them. */
export async function resetMainIncidentFixture() {
  const { url, serviceRoleKey } = requireSupabaseEnv();
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const minus = (mins: number) => new Date(now - mins * 60 * 1000).toISOString();

  const { error: incidentError } = await admin
    .from("incidents")
    .update({
      status: "awaiting_approval",
      recovery_pct: 0,
    })
    .eq("id", MAIN_INCIDENT_ID);
  if (incidentError) {
    throw new Error(`E2E reset main incident failed: ${incidentError.message}`);
  }

  const { error: actionsError } = await admin.from("incident_actions").upsert(
    [
      {
        id: "00000000-0000-0000-0002-000000000001",
        incident_id: MAIN_INCIDENT_ID,
        title: "Add sizing guidance to product page",
        description:
          "Publish size chart and fit notes (runs small — size up) to the Court Trainer PDP.",
        impact_level: "high",
        risk_level: "low",
        auto_deploy: true,
        status: "deployed",
        deployed_at: minus(35),
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0002-000000000002",
        incident_id: MAIN_INCIDENT_ID,
        title: "Enable fit assistant widget",
        description:
          "Activate the AI fit recommendation widget on the product page — personalised size suggestion based on past orders.",
        impact_level: "high",
        risk_level: "low",
        auto_deploy: false,
        status: "proposed",
        deployed_at: null,
        approved_at: null,
        approved_by: null,
        created_at: minus(38),
      },
      {
        id: "00000000-0000-0000-0002-000000000003",
        incident_id: MAIN_INCIDENT_ID,
        title: "Update support flow — exchange before refund",
        description:
          "Route sizing-related support tickets to exchange offer first. Estimated to recover £8,200 in refunds.",
        impact_level: "medium",
        risk_level: "low",
        auto_deploy: false,
        status: "proposed",
        deployed_at: null,
        approved_at: null,
        approved_by: null,
        created_at: minus(37),
      },
      {
        id: "00000000-0000-0000-0002-000000000004",
        incident_id: MAIN_INCIDENT_ID,
        title: "Pause cold-traffic Meta campaign",
        description:
          "Pause 'Womens Launch Prospecting' (ROAS 1.1x) to stop driving unsized first-time buyers until fit assistant is live.",
        impact_level: "high",
        risk_level: "high",
        auto_deploy: false,
        status: "proposed",
        deployed_at: null,
        approved_at: null,
        approved_by: null,
        created_at: minus(37),
      },
    ],
    { onConflict: "id" },
  );
  if (actionsError) {
    throw new Error(`E2E reset main incident actions failed: ${actionsError.message}`);
  }
}

/** Restore stockout incident status after kanban E2E mutates it. */
export async function resetStatusChangeIncidentFixture() {
  const { url, serviceRoleKey } = requireSupabaseEnv();
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin
    .from("incidents")
    .update({ status: "fix_proposed" })
    .eq("id", STATUS_CHANGE_INCIDENT_ID);
  if (error) {
    throw new Error(`E2E reset status-change incident failed: ${error.message}`);
  }
}

export async function resetAllE2eFixtures() {
  await resetMainIncidentFixture();
  await resetStatusChangeIncidentFixture();
}
