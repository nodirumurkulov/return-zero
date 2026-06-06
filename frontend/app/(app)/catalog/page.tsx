import CatalogGrid from "@/components/catalog/CatalogGrid";
import { EmptyState } from "@/components/ui/empty-state";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = await createClient();
  const scope = await getStoreScope();
  const result = await getStore(supabase).catalog.list({ scope }).catch(
    (err: unknown): { error: string } => ({
      error: err instanceof Error ? err.message : "Unknown error",
    }),
  );

  if ("error" in result) {
    return (
      <div className="p-6">
        <EmptyState title="Could not load catalog" description={result.error} />
      </div>
    );
  }

  return <CatalogGrid products={result.products} />;
}
