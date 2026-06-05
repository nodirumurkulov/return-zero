import AppShell from "@/components/layout/AppShell";
import { getCurrentOrganizationId } from "@/lib/organizations";
import { listSearchTargets } from "@/lib/stores/analytics/search";
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
    ? await listSearchTargets(supabase, organizationId).catch(() => [])
    : [];

  return (
    <AppShell user={shellUser} searchTargets={searchTargets}>
      {children}
    </AppShell>
  );
}
