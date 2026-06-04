import { createClient } from "@supabase/supabase-js";
import {
  COURT_TRAINER_PRODUCT_ID,
  E2E_DETECTED_INCIDENT_ID,
  E2E_DETECTED_INCIDENT_TITLE,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
} from "./constants";
import { requireSupabaseEnv } from "./env";

export default async function globalSetup() {
  const { url, serviceRoleKey } = requireSupabaseEnv();
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: createError } = await admin.auth.admin.createUser({
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
    email_confirm: true,
  });
  if (
    createError &&
    !/already|exists|registered/i.test(createError.message)
  ) {
    throw new Error(`E2E global-setup: create user failed: ${createError.message}`);
  }

  const { error: incidentError } = await admin.from("incidents").upsert(
    {
      id: E2E_DETECTED_INCIDENT_ID,
      title: E2E_DETECTED_INCIDENT_TITLE,
      status: "detected",
      severity: "medium",
      impact_amount: 1000,
      impact_label: "test exposure",
      affected_product: COURT_TRAINER_PRODUCT_ID,
      affected_kpis: ["return_rate"],
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (incidentError) {
    throw new Error(
      `E2E global-setup: detected incident upsert failed: ${incidentError.message}`,
    );
  }
}
