import type { SupabaseClient } from "@supabase/supabase-js";

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
    .select("id, name, slug, slack_channel_id, slack_team_id, created_at, updated_at")
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

  return org;
}
