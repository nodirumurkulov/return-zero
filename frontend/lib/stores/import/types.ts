import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database, Enums, Tables } from "@/lib/supabase/db";
import type { StoreScope } from "@/lib/tenancy/types";

import type { ExternalIdTable } from "./loaders/csv";

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

export type ImportStartResult =
  | { action: "skipped" }
  | { action: "started" }
  | { action: "already_syncing" };

export interface ImportLoadOpts {
  replace?: boolean;
}

export interface ImportLoader {
  readonly platform: StorePlatform;
  load(
    supabase: SupabaseClient<Database>,
    scope: StoreScope,
    source: unknown,
    opts?: ImportLoadOpts,
  ): Promise<ImportTableResult[]>;
}

export type ImportRunOpts = {
  scope: StoreScope;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
};

export type ImportStatusOpts = {
  scope: StoreScope;
};

export type ImportExternalIdMapOpts = {
  scope: StoreScope;
  table: ExternalIdTable;
};

export const storePlatformSchema = z.enum(["mock_csv", "shopify"]);

export const importResultSchema = z.object({
  table: z.string(),
  count: z.number(),
  error: z.string().optional(),
});

export const importSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    results: z.array(importResultSchema),
  })
  .strict();

export const importPartialResponseSchema = z
  .object({
    success: z.literal(false),
    results: z.array(importResultSchema),
  })
  .strict();

export const importSyncingResponseSchema = z
  .object({
    syncing: z.literal(true),
  })
  .strict();

export const importSkippedResponseSchema = z
  .object({
    skipped: z.literal(true),
  })
  .strict();

export const importResponseSchema = z.union([
  importSuccessResponseSchema,
  importPartialResponseSchema,
  importSyncingResponseSchema,
  importSkippedResponseSchema,
  z.object({ error: z.string() }),
]);

export type ImportResponse = z.infer<typeof importResponseSchema>;
