import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { createOrganizationWithOwner } from "./create";
import { TenancyError } from "./errors";

function slugifyShopName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomUUID().slice(0, 8);
  return `${base || "shop"}-${suffix}`;
}

async function findUserIdByEmail(
  supabase: SupabaseClient<Database>,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw new TenancyError(error.message);
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

export async function ensureShopOwnerUser(
  supabase: SupabaseClient<Database>,
  email: string,
): Promise<string> {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (created.user?.id) {
    return created.user.id;
  }

  if (createError && /already|exists|registered/i.test(createError.message)) {
    const existingId = await findUserIdByEmail(supabase, email);
    if (existingId) {
      return existingId;
    }
  }

  throw new TenancyError(createError?.message ?? "Failed to create shop owner user");
}

export async function ensureShopOwnerOrg(
  supabase: SupabaseClient<Database>,
  userId: string,
  shopName: string,
): Promise<string> {
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw new TenancyError(memberError.message);
  }

  if (membership?.organization_id) {
    return membership.organization_id;
  }

  const org = await createOrganizationWithOwner(supabase, {
    userId,
    name: shopName,
    slug: slugifyShopName(shopName),
  });

  return org.id;
}

export async function createMagicLinkSession(
  supabase: SupabaseClient<Database>,
  email: string,
  redirectTo: string,
): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const actionLink = data.properties?.action_link;
  if (error || !actionLink) {
    throw new TenancyError(error?.message ?? "Failed to generate magic link");
  }

  return actionLink;
}
