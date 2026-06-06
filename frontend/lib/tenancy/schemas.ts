import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";

export const switchActiveStoreBodySchema = z.object({
  storeId: z.string().uuid(),
});

export type SwitchActiveStoreBody = z.infer<typeof switchActiveStoreBodySchema>;

const organizationSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

const storeSummarySchema = z
  .object({
    id: z.string().uuid(),
    label: z.string().nullable(),
    platform: z.enum(Constants.public.Enums.store_platform),
    status: z.enum(Constants.public.Enums.store_connection_status),
  })
  .strict();

const storeScopeSchema = z
  .object({
    organizationId: z.string().uuid(),
    storeId: z.string().uuid(),
  })
  .strict();

export const appTenancyResponseSchema = z
  .object({
    organization: organizationSummarySchema,
    stores: z.array(storeSummarySchema),
    activeStore: storeSummarySchema,
    scope: storeScopeSchema,
  })
  .strict();

export type AppTenancyResponse = z.infer<typeof appTenancyResponseSchema>;
