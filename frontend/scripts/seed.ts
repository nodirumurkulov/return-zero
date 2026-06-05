/**
 * Bootstrap demo org and auth user. Store data is loaded by the user via onboarding connect.
 *
 *   bun run scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";

import { resolveDemoCredentials } from "../lib/auth/demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000100";

const supabase = createClient(url, key);

async function ensureDemoOrganization(): Promise<string> {
  console.log("  demo organization…");
  const { error } = await supabase.from("organizations").upsert(
    {
      id: DEMO_ORG_ID,
      name: "Pretty Fly",
      slug: "pretty-fly",
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(`demo organization: ${error.message}`);
  }
  console.log("  ✓ Pretty Fly organization");
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

async function main() {
  console.log("=== Resolve — seed script ===\n");

  try {
    const organizationId = await ensureDemoOrganization();
    await ensureDemoUserMembership(organizationId);
    console.log("\nConnect the Pretty Fly demo store at /onboarding to load catalog data.\n");
    console.log("=== Done ✓ ===\n");
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

main();
