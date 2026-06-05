import StoreConnectForm from "@/components/onboarding/StoreConnectForm";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { getStoreConnection } from "@/lib/stores";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const org = await tryRequireOrganizationId(supabase);

  const [{ count }, connection] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    org.ok ? getStoreConnection(supabase, org.organizationId) : Promise.resolve(null),
  ]);

  const productCount = count ?? 0;
  const mockStoreReady =
    connection?.platform === "mock_csv" &&
    connection.status === "connected" &&
    productCount > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your store</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an integration below. Your demo store is provisioned automatically — no file uploads.
        </p>
      </div>

      <StoreConnectForm mockStoreReady={mockStoreReady} />
    </div>
  );
}
