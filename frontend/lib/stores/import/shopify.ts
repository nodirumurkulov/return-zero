import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

import type { ImportLoadOpts, ImportLoader, ImportTableResult } from "./types";

export class ShopifyImportLoader implements ImportLoader {
  readonly platform = "shopify" as const;

  load(
    _supabase: SupabaseClient<Database>,
    _scope: StoreScope,
    _source: unknown,
    _opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]> {
    return Promise.reject(new Error("Shopify is not available yet"));
  }
}
