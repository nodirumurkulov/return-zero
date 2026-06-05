import StoreConnectForm from "@/components/onboarding/StoreConnectForm";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { MockStore } from "@/lib/stores";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const org = await tryRequireOrganizationId(supabase);

  if (!org.ok) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <p className="text-sm text-muted-foreground">{org.error}</p>
      </div>
    );
  }

  const [{ count }, connection] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.organizationId),
    new MockStore().getConnection(supabase, org.organizationId),
  ]);

  const productCount = count ?? 0;
  const mockStoreReady =
    connection?.platform === "mock_csv" &&
    connection.status === "connected" &&
    productCount > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze your store</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your demo store is ready. Run analysis to learn what&apos;s normal and surface patterns
          worth watching.
        </p>
      </div>

      <StoreConnectForm mockStoreReady={mockStoreReady} />
    </div>
  );
}
