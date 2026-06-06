import { appTenancyResponseSchema, type AppTenancyResponse } from "@/lib/tenancy";

import { apiClient } from "../../client";

export async function switchActiveStore(storeId: string): Promise<AppTenancyResponse> {
  const raw: unknown = await apiClient("/api/stores/active", {
    method: "PATCH",
    body: JSON.stringify({ storeId }),
  });
  return appTenancyResponseSchema.parse(raw);
}
