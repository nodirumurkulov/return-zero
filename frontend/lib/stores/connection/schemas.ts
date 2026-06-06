import { z } from "zod";

export const storePlatformSchema = z.enum(["mock_csv", "shopify"]);

export const storeConnectionStatusSchema = z.enum([
  "pending",
  "importing",
  "connected",
  "error",
  "disconnected",
]);

export const storeConnectionPhaseSchema = z.enum(["idle", "catalog", "commerce", "ready"]);

export const storeConnectionSnapshotSchema = z
  .object({
    platform: storePlatformSchema.nullable(),
    status: storeConnectionStatusSchema,
    phase: storeConnectionPhaseSchema,
    catalogReady: z.boolean(),
    connectedAt: z.string().datetime().nullable(),
  })
  .strict();

export const storeConnectionResponseSchema = z
  .object({
    connection: storeConnectionSnapshotSchema,
  })
  .strict();

export const connectStoreBodySchema = z
  .object({
    platform: storePlatformSchema,
  })
  .strict();
