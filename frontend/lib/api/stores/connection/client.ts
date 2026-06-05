import { z } from "zod";

import { apiClient } from "../../client";

const storeConnectionSchema = z.record(z.string(), z.unknown());

export const connectionResponseSchema = z
  .object({
    connection: storeConnectionSchema.nullable(),
  })
  .strict();

export type ConnectionResponse = z.infer<typeof connectionResponseSchema>;

export async function getStoreConnection(): Promise<ConnectionResponse> {
  const data = await apiClient("/api/stores/connection", {
    output: connectionResponseSchema,
  });
  return data;
}
