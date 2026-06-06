import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { createOrganizationWithOwner } from "@/lib/tenancy/create";

import { ShopifyError } from "./errors";
import type { ShopInfo } from "./shop-info";

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
    throw new ShopifyError(error.message);
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

  throw new ShopifyError(createError?.message ?? "Failed to create shop owner user");
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
    throw new ShopifyError(memberError.message);
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

async function findOrganizationByShopDomain(
  supabase: SupabaseClient<Database>,
  myshopifyDomain: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("store_connections")
    .select("organization_id")
    .eq("platform", "shopify")
    .eq("external_shop_id", myshopifyDomain)
    .maybeSingle();

  if (error) {
    throw new ShopifyError(error.message);
  }

  return data?.organization_id ?? null;
}

async function findOrgOwnerUserId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ShopifyError(error.message);
  }

  if (data?.user_id) {
    return data.user_id;
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    throw new ShopifyError(fallbackError.message);
  }

  return fallback?.user_id ?? null;
}

async function findUserEmail(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    throw new ShopifyError(error.message);
  }

  return data.user?.email ?? null;
}

export type ShopLoginUser = {
  organizationId: string;
  email: string;
  userId: string;
  isNew: boolean;
};

export async function resolveShopLoginUser(
  supabase: SupabaseClient<Database>,
  shopInfo: ShopInfo,
): Promise<ShopLoginUser> {
  const existingOrgId = await findOrganizationByShopDomain(supabase, shopInfo.myshopifyDomain);
  if (existingOrgId) {
    const userId = await findOrgOwnerUserId(supabase, existingOrgId);
    if (!userId) {
      throw new ShopifyError("Shop organization has no owner");
    }

    const email = (await findUserEmail(supabase, userId)) ?? shopInfo.email;
    return {
      organizationId: existingOrgId,
      email,
      userId,
      isNew: false,
    };
  }

  const userId = await ensureShopOwnerUser(supabase, shopInfo.email);
  const organizationId = await ensureShopOwnerOrg(supabase, userId, shopInfo.name);
  return {
    organizationId,
    email: shopInfo.email,
    userId,
    isNew: true,
  };
}

export async function resolveOrganizationIdForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ShopifyError(error.message);
  }

  return data?.organization_id ?? null;
}

export async function hadShopifyConnectionBeforeOAuth(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  myshopifyDomain: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("store_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("platform", "shopify")
    .eq("external_shop_id", myshopifyDomain)
    .maybeSingle();

  if (error) {
    throw new ShopifyError(error.message);
  }

  return data != null;
}
