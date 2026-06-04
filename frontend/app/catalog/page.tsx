import type { SupabaseClient } from "@supabase/supabase-js";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import { EmptyState } from "@/components/ui/empty-state";
import { getCatalogProducts, type CatalogProduct } from "@/lib/metrics/catalog";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CatalogResult =
  | { ok: true; products: CatalogProduct[] }
  | { ok: false; error: string };

async function loadCatalog(
  supabase: SupabaseClient,
): Promise<CatalogResult> {
  try {
    const products = await getCatalogProducts(supabase);
    return { ok: true, products };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function CatalogPage() {
  const supabase = createServiceClient();
  const result = await loadCatalog(supabase);

  if (!result.ok) {
    return (
      <div className="p-6">
        <EmptyState title="Could not load catalog" description={result.error} />
      </div>
    );
  }

  return <CatalogGrid products={result.products} />;
}
