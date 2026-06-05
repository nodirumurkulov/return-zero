import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums, Tables } from "@/lib/supabase/db";

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

export type ImportRunOpts = {
  organizationId: string;
  platform: StorePlatform;
  source?: unknown;
  replace?: boolean;
};

export type ImportStatusOpts = {
  organizationId: string;
};

export type ImportExternalIdMapOpts = {
  organizationId: string;
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

export const importResponseSchema = z.union([
  importSuccessResponseSchema,
  importPartialResponseSchema,
  z.object({ error: z.string() }),
]);

export type ImportResponse = z.infer<typeof importResponseSchema>;
