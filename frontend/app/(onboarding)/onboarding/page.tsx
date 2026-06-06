import StoreConnectForm from "@/components/onboarding/StoreConnectForm";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const org = await tryRequireOrganizationId(supabase);

  if (!org.ok) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <p className="text-sm text-muted-foreground">{org.error}</p>
      </div>
    );
  }

  const [{ count }, connection] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.organizationId),
    getStore(supabase).import.status({ organizationId: org.organizationId }),
  ]);

  const productCount = count ?? 0;
  const storeReady =
    connection?.platform === "mock_csv" && connection.status === "connected" && productCount > 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Connect your store</h1>
          <p className="text-sm text-muted-foreground">
            Link a store to start monitoring products and incidents.
          </p>
        </div>

        <StoreConnectForm storeReady={storeReady} />
      </div>
    </div>
  );
}
