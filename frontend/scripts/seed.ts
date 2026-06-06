/**
 * Bootstrap demo org and auth user. Store data is loaded by the user via onboarding connect.
 *
 *   bun run seed                  # org + demo user only
 *   bun run seed -- --full        # + Hugo mock store + demo kanban incidents
 *   bun run seed -- --full --e2e  # + E2E user + detected incident (for Playwright)
 */
import { createClient } from "@supabase/supabase-js";

import { seedDemoKanbanData } from "../e2e/fixtures/demo-data";
import { ensureE2eUser, seedE2eDetectedIncident } from "../e2e/fixtures/e2e-user";
import { resolveDemoCredentials } from "../lib/auth/demo";
import { MockImportLoader } from "../lib/stores/import/mock";
import { readHugoMockStorePack } from "../lib/stores/import/mock/pack";
import type { Database } from "../lib/supabase/database.types";
import { HUGO_MOCK_STORE_NAME, HUGO_MOCK_STORE_SLUG } from "../lib/tenancy";
import type { StoreScope } from "../lib/tenancy/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000100";
const fullBootstrap = process.argv.includes("--full");
const e2eBootstrap = process.argv.includes("--e2e");

const supabase = createClient<Database>(url, key);

async function ensureDemoOrganization(): Promise<string> {
  console.log("  demo organization…");
  const slackChannelId = process.env.SLACK_DEFAULT_CHANNEL?.trim();
  const { error } = await supabase.from("organizations").upsert(
    {
      id: DEMO_ORG_ID,
      name: HUGO_MOCK_STORE_NAME,
      slug: HUGO_MOCK_STORE_SLUG,
      ...(slackChannelId ? { slack_channel_id: slackChannelId } : {}),
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(`demo organization: ${error.message}`);
  }
  console.log(`  ✓ ${HUGO_MOCK_STORE_NAME} organization`);
  return DEMO_ORG_ID;
}

async function resolveDemoUserId(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(`  ✗ list users: ${error.message}`);
    return null;
  }
  return data.users.find((user) => user.email === email)?.id ?? null;
}

async function ensureDemoUserMembership(organizationId: string) {
  const credentials = resolveDemoCredentials();
  if (!credentials) {
    console.log("  demo user… skipped (set DEMO_USER_* in production)");
    return;
  }

  console.log("  demo user…");
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
  });

  const userId =
    created.user?.id ??
    (createError && /already|exists|registered/i.test(createError.message)
      ? await resolveDemoUserId(credentials.email)
      : null);

  if (!userId) {
    console.error(`  ✗ demo user: ${createError?.message ?? "no user id"}`);
    return;
  }

  const { error: memberError } = await supabase.from("organization_members").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: "owner",
    },
    { onConflict: "organization_id,user_id" },
  );
  if (memberError) {
    console.error(`  ✗ demo membership: ${memberError.message}`);
    return;
  }

  console.log(`  ✓ demo user (${credentials.email})`);
}

async function resolveDemoStoreScope(organizationId: string): Promise<StoreScope> {
  const { data: store, error } = await supabase
    .from("store_connections")
    .select("id")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !store?.id) {
    throw new Error(`store_connections read failed: ${error?.message ?? "no store"}`);
  }
  return { organizationId, storeId: store.id };
}

async function ensureFullDemoStore(organizationId: string): Promise<StoreScope> {
  console.log(`  loading ${HUGO_MOCK_STORE_NAME}…`);
  const scope = await resolveDemoStoreScope(organizationId);
  const loader = new MockImportLoader();
  const results = await loader.load(supabase, scope, readHugoMockStorePack(), {
    replace: true,
  });
  if (!results.every((result) => !result.error)) {
    throw new Error("Demo store load failed");
  }

  const { error: connectionError } = await supabase
    .from("store_connections")
    .update({
      platform: "mock_csv",
      status: "connected",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", scope.storeId);
  if (connectionError) {
    throw new Error(`store_connections update failed: ${connectionError.message}`);
  }
  console.log("  ✓ demo store connected");

  const productIdByExternalId = await loader.fetchExternalIdMap(supabase, "products", scope);
  await seedDemoKanbanData(supabase, organizationId, scope.storeId, productIdByExternalId);
  console.log("  ✓ demo KPI thresholds + kanban incidents");
  return scope;
}

async function ensureE2eFixtures(organizationId: string, storeId: string) {
  console.log("  e2e user…");
  await ensureE2eUser(supabase);
  console.log("  ✓ e2e user");
  await seedE2eDetectedIncident(supabase, organizationId, storeId);
  console.log("  ✓ e2e detected incident");
}

async function main() {
  console.log("=== Hugo — seed script ===\n");

  try {
    const organizationId = await ensureDemoOrganization();
    await ensureDemoUserMembership(organizationId);

    if (fullBootstrap) {
      const scope = await ensureFullDemoStore(organizationId);
      if (e2eBootstrap) {
        await ensureE2eFixtures(organizationId, scope.storeId);
      }
    } else if (e2eBootstrap) {
      throw new Error("--e2e requires --full (store + demo incidents must exist first)");
    }

    if (!fullBootstrap) {
      console.log(`\nConnect the ${HUGO_MOCK_STORE_NAME} at /onboarding to load catalog data.\n`);
    }
    console.log("=== Done ✓ ===\n");
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

void main();
