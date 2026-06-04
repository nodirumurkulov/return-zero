import { EmptyState } from "@/components/ui/empty-state";

export default function CatalogEmpty() {
  return (
    <EmptyState
      title="No products found"
      description="Try a different search term or clear filters to browse the full catalog."
    />
  );
}
