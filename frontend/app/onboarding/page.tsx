import Link from "next/link";
import UploadForm from "@/components/onboarding/UploadForm";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { loadBusinessProfile, loadProductCostRows } from "@/lib/settings/queries";
import { businessProfileResponseSchema } from "@/lib/settings/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
  const productCount = count ?? 0;

  const orgResult = await tryRequireOrganizationId(supabase);
  const resolvedProfile = orgResult.ok
    ? businessProfileResponseSchema.parse({
        profile: await loadBusinessProfile(supabase, orgResult.organizationId).then((profile) => ({
          platform: profile.platform,
          storeName: profile.storeName,
          primaryGoal: profile.primaryGoal,
          targetMarginPct: profile.targetMarginPct,
          minRoas: profile.minRoas,
          leadTimeDays: profile.leadTimeDays,
          bufferDays: profile.bufferDays,
          heroProductIds: profile.heroProductIds,
        })),
        productCosts: await loadProductCostRows(supabase, orgResult.organizationId),
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your store&apos;s CSV exports. We&apos;ll learn what&apos;s normal for your business and watch
          for problems before they cost you.
        </p>
      </div>

      {productCount > 0 && (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          You already have <span className="font-medium text-foreground">{productCount}</span> products loaded.{" "}
          <Link href="/catalog" className="font-medium text-primary underline-offset-4 hover:underline">
            Explore your catalog →
          </Link>
        </div>
      )}

      <UploadForm initialProfile={resolvedProfile} />
    </div>
  );
}
