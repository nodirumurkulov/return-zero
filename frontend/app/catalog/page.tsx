import { createServiceClient } from "@/lib/supabase/server";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import { getCatalogProducts } from "@/lib/metrics/catalog";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = createServiceClient();

  let products;
  try {
    products = await getCatalogProducts(supabase);
  } catch (err) {
    return (
      <div className="p-6">
        <EmptyState
          title="Could not load catalog"
          description={err instanceof Error ? err.message : "Unknown error"}
        />
      </div>
    );
  }

  return <CatalogGrid products={products} />;
}
