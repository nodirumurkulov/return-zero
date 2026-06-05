import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/supabase/db";

export type StorePlatform = Enums<"store_platform">;
export type StoreConnection = Tables<"store_connections">;

export interface ImportTableResult {
  table: string;
  count: number;
  error?: string;
}

export interface ImportRunResult {
  results: ImportTableResult[];
  success: boolean;
}

export interface ImportLoadOpts {
  replace?: boolean;
}

export interface ImportLoader {
  readonly platform: StorePlatform;
  load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]>;
}

export {
  importPartialResponseSchema,
  importResponseSchema,
  importResultSchema,
  importSuccessResponseSchema,
  storePlatformSchema,
  type ImportResponse,
} from "./schemas";
