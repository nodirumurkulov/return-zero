import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { Organization } from "./organization";

export class OrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationError";
  }
}

/** First organization the authenticated user belongs to (MVP: one org per user). */
export async function getCurrentOrganizationId(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new OrganizationError(error.message);
  return data?.organization_id ?? null;
}

export async function requireOrganizationId(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    throw new OrganizationError("No organization membership found for user");
  }
  return organizationId;
}

export type OrganizationIdResult =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

/** Non-throwing org resolution for routes and server actions (avoids try/catch + let). */
export async function tryRequireOrganizationId(
  supabase: SupabaseClient<Database>,
): Promise<OrganizationIdResult> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { ok: false, error: "No organization membership found for user" };
  }
  return { ok: true, organizationId };
}

export async function listOrganizationsForUser(
  supabase: SupabaseClient<Database>,
): Promise<Organization[]> {
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, updated_at")
    .eq("id", organizationId);

  if (error) throw new OrganizationError(error.message);
  return data ?? [];
}

export async function createOrganizationWithOwner(
  supabase: SupabaseClient<Database>,
  params: { userId: string; name: string; slug: string },
): Promise<Organization> {
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: params.name, slug: params.slug })
    .select("id, name, slug, created_at, updated_at")
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

/** All organization ids (for cron iterating tenants). Service role only. */
export async function listAllOrganizationIds(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data, error } = await supabase.from("organizations").select("id");
  if (error) throw new OrganizationError(error.message);
  return (data ?? []).map((row) => row.id);
}
