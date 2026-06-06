import "server-only";

import { cache } from "react";

import type { TypedSupabaseClient } from "@/lib/supabase/db";
import { createClient } from "@/lib/supabase/server";

import { listAllOrganizationIds, listAllStoreScopes } from "./admin";
import { createOrganizationWithOwner } from "./create";
import {
  getOrganizationSlackChannel,
  resolveOrganizationIdForSlackTeam,
  resolveOrganizationSlackDeliveryChannel,
  resolveSlackDeliveryChannel,
} from "./slack";
import { Tenancy } from "./tenancy";

export function getTenancy(supabase: TypedSupabaseClient): Tenancy {
  return new Tenancy(supabase);
}

export const getAppTenancy = cache(async () => {
  const supabase = await createClient();
  return getTenancy(supabase).resolve();
});

export const getStoreScope = cache(async () => {
  const supabase = await createClient();
  return getTenancy(supabase).getStoreScope();
});

export async function tryGetStoreScope(supabase: TypedSupabaseClient) {
  return getTenancy(supabase).tryGetStoreScope();
}

export {
  createOrganizationWithOwner,
  listAllOrganizationIds,
  listAllStoreScopes,
  getOrganizationSlackChannel,
  resolveOrganizationIdForSlackTeam,
  resolveOrganizationSlackDeliveryChannel,
  resolveSlackDeliveryChannel,
};
