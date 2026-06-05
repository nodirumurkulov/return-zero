import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/supabase/db";

export type StorePlatform = Enums<"store_platform">;
export type StoreConnection = Tables<"store_connections">;

export interface LoadResult {
  table: string;
  count: number;
  error?: string;
}

export interface StoreLoadOpts {
  replace?: boolean;
}

export interface StoreConnector {
  readonly platform: StorePlatform;
  load(
    supabase: SupabaseClient<Database>,
    organizationId: string,
    source: unknown,
    opts?: StoreLoadOpts,
  ): Promise<LoadResult[]>;
}

export {
  connectPartialResponseSchema,
  connectResponseSchema,
  connectResultSchema,
  connectSuccessResponseSchema,
  type ConnectResponse,
} from "./schemas";
