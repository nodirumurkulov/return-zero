import { createClient } from "@supabase/supabase-js";
import {
  COURT_TRAINER_PRODUCT_EXTERNAL_ID,
  DEMO_ORG_ID,
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

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
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

  const { data: listedUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    throw new Error(`E2E global-setup: list users failed: ${listError.message}`);
  }
  const e2eUserId =
    createdUser.user?.id ??
    listedUsers.users.find((user) => user.email === E2E_USER_EMAIL)?.id ??
    null;
  if (!e2eUserId) {
    throw new Error("E2E global-setup: could not resolve E2E user id");
  }

  const { error: memberError } = await admin.from("organization_members").upsert(
    {
      organization_id: DEMO_ORG_ID,
      user_id: e2eUserId,
      role: "member",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (memberError) {
    throw new Error(`E2E global-setup: org membership failed: ${memberError.message}`);
  }

  const { data: heroProduct, error: productError } = await admin
    .from("products")
    .select("id")
    .eq("organization_id", DEMO_ORG_ID)
    .eq("external_id", COURT_TRAINER_PRODUCT_EXTERNAL_ID)
    .maybeSingle();
  if (productError) {
    throw new Error(`E2E global-setup: hero product lookup failed: ${productError.message}`);
  }
  if (!heroProduct?.id) {
    throw new Error(
      "E2E global-setup: Court Trainer product not found — run `bun run seed` before E2E",
    );
  }

  const { error: incidentError } = await admin.from("incidents").upsert(
    {
      id: E2E_DETECTED_INCIDENT_ID,
      organization_id: DEMO_ORG_ID,
      title: E2E_DETECTED_INCIDENT_TITLE,
      status: "detected",
      severity: "medium",
      impact_amount: 1000,
      impact_label: "test exposure",
      product_id: heroProduct.id,
      affected_kpi_keys: ["return_rate"],
      recovery_pct: 0,
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
