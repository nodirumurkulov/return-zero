import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";

import type { ImportLoadOpts, ImportTableResult, ImportLoader } from ".";

export class ShopifyImportLoader implements ImportLoader {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _organizationId: string,
    _source: unknown,
    _opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]> {
    return Promise.reject(new Error("Shopify is not available yet"));
  }
}
