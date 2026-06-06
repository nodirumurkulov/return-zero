import AppShell from "@/components/layout/AppShell";
import { TenancyProvider } from "@/components/providers/TenancyProvider";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { getAppTenancy } from "@/lib/tenancy/server";

function displayNameFromMetadata(metadata: unknown): string | null {
  if (typeof metadata !== "object" || metadata === null) return null;
  const record = metadata as Record<string, unknown>;
  if (typeof record.full_name === "string" && record.full_name.length > 0) {
    return record.full_name;
  }
  if (typeof record.name === "string" && record.name.length > 0) {
    return record.name;
  }
  return null;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return children;
  }

  const shellUser = {
    id: user.id,
    email: user.email ?? null,
    name: displayNameFromMetadata(user.user_metadata),
  };

  const tenancy = await getAppTenancy().catch(() => null);
  const searchTargets = tenancy
    ? await getStore(supabase).search.list({ scope: tenancy.scope }).catch(() => [])
    : [];

  const shell = (
    <AppShell user={shellUser} searchTargets={searchTargets} showStoreSwitcher={tenancy != null}>
      {children}
    </AppShell>
  );

  if (!tenancy) {
    return shell;
  }

  return <TenancyProvider value={tenancy}>{shell}</TenancyProvider>;
}
