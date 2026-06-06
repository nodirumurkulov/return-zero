import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { ShopifyError } from "./errors";

export type StoreConnectionSecret = {
  accessToken: string;
  scopes: string;
};

export async function upsertStoreSecret(
  storeId: string,
  accessToken: string,
  scopes: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("store_connection_secrets").upsert(
    {
      store_id: storeId,
      access_token: accessToken,
      scopes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "store_id" },
  );

  if (error) {
    throw new ShopifyError(`store_connection_secrets upsert failed: ${error.message}`);
  }
}

export async function readStoreSecret(storeId: string): Promise<StoreConnectionSecret | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_connection_secrets")
    .select("access_token, scopes")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) {
    throw new ShopifyError(`store_connection_secrets read failed: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    accessToken: data.access_token,
    scopes: data.scopes,
  };
}

export async function deleteStoreSecret(storeId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("store_connection_secrets")
    .delete()
    .eq("store_id", storeId);

  if (error) {
    throw new ShopifyError(`store_connection_secrets delete failed: ${error.message}`);
  }
}
