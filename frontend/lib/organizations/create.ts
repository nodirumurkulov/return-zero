import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getStore } from "@/lib/stores/server";
import type { Database } from "@/lib/supabase/database.types";

import type { Organization } from "./organization";
import { OrganizationError } from "./queries";

export async function createOrganizationWithOwner(
  supabase: SupabaseClient<Database>,
  params: { userId: string; name: string; slug: string },
): Promise<Organization> {
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: params.name, slug: params.slug })
    .select("id, name, slug, slack_team_id, created_at, updated_at")
    .single();

  if (orgErr || !org) {
    throw new OrganizationError(orgErr?.message ?? "Failed to create organization");
  }

  const { error: memberErr } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: params.userId,
    role: "owner",
  });

  if (memberErr) {
    throw new OrganizationError(memberErr.message);
  }

  const provisioned = await getStore(supabase).import.run({
    organizationId: org.id,
    platform: "mock_csv",
  });
  if (!provisioned.success) {
    const failed = provisioned.results.filter((result) => result.error).map((result) => result.table);
    throw new OrganizationError(
      failed.length > 0 ? `Demo store load failed: ${failed.join(", ")}` : "Demo store load failed",
    );
  }

  return org;
}
