import Link from "next/link";
import StoreConnectForm from "@/components/onboarding/StoreConnectForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
  const productCount = count ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your store</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a store to connect. We&apos;ll learn what&apos;s normal for your business and watch for
          problems before they cost you.
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

      <StoreConnectForm />
    </div>
  );
}
