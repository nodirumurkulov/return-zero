import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { ShopifyError } from "./errors";

export async function establishSessionForEmail(
  admin: SupabaseClient<Database>,
  routeClient: SupabaseClient<Database>,
  email: string,
): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) {
    throw new ShopifyError(error?.message ?? "Failed to generate session token");
  }

  const { error: verifyError } = await routeClient.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });

  if (verifyError) {
    throw new ShopifyError(verifyError.message);
  }
}
