import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveActiveStoreId } from "@/lib/stores/connection/reset-store-data";
import type { Database } from "@/lib/supabase/database.types";

import {
  COURT_TRAINER_PRODUCT_EXTERNAL_ID,
  DEMO_ORG_ID,
  E2E_DETECTED_INCIDENT_ID,
  E2E_DETECTED_INCIDENT_TITLE,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
} from "../constants";

export async function ensureE2eUser(supabase: SupabaseClient<Database>): Promise<string> {
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: E2E_USER_EMAIL,
    password: E2E_USER_PASSWORD,
    email_confirm: true,
  });
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    throw new Error(`E2E user create failed: ${createError.message}`);
  }

  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`E2E list users failed: ${listError.message}`);
  }

  const e2eUserId =
    createdUser.user?.id ??
    listedUsers.users.find((user) => user.email === E2E_USER_EMAIL)?.id ??
    null;
  if (!e2eUserId) {
    throw new Error("E2E user id could not be resolved");
  }

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: DEMO_ORG_ID,
      user_id: e2eUserId,
      role: "member",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (memberError) {
    throw new Error(`E2E org membership failed: ${memberError.message}`);
  }

  return e2eUserId;
}

export async function seedE2eDetectedIncident(
  supabase: SupabaseClient<Database>,
  organizationId: string,
) {
  const { data: heroProduct, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("external_id", COURT_TRAINER_PRODUCT_EXTERNAL_ID)
    .maybeSingle();
  if (productError) {
    throw new Error(`E2E hero product lookup failed: ${productError.message}`);
  }
  if (!heroProduct?.id) {
    throw new Error("E2E hero product not found — run seed with --full first");
  }

  const storeId = await resolveActiveStoreId(supabase, organizationId);

  const { error: incidentError } = await supabase.from("incidents").upsert(
    {
      id: E2E_DETECTED_INCIDENT_ID,
      organization_id: organizationId,
      store_id: storeId,
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
    throw new Error(`E2E detected incident upsert failed: ${incidentError.message}`);
  }
}
