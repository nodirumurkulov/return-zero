import AppShell from "@/components/layout/AppShell";
import { getCurrentOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

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
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
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
