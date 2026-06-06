import { test as base } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "../env";

export const test = base.extend<{ admin: SupabaseClient }>({
  admin: async ({}, use) => {
    const { url, serviceRoleKey } = requireSupabaseEnv();
    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await use(admin);
  },
});

export { expect } from "@playwright/test";
export {
  resetAllE2eFixtures,
  resetMainIncidentFixture,
  resetStatusChangeIncidentFixture,
} from "./db-resets";
