import AppShell from "@/components/layout/AppShell";
import { getCurrentOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

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

  const organizationId = await getCurrentOrganizationId(supabase);
  const searchTargets = organizationId
    ? await getStore(supabase).search.list({ organizationId }).catch(() => [])
    : [];

  return (
    <AppShell user={shellUser} searchTargets={searchTargets}>
      {children}
    </AppShell>
  );
}
