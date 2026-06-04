"use client";

import { useMemo, useState } from "react";
import CatalogEmpty from "@/components/catalog/CatalogEmpty";
import ProductCatalogCard from "@/components/catalog/ProductCatalogCard";
import { Input } from "@/components/ui/input";
import {
  computeProductHealth,
  type KpiThreshold,
  type ProductMetric,
} from "@/types/database";

export default function CatalogGrid({
  products,
  thresholdsByProduct,
}: {
  products: ProductMetric[];
  thresholdsByProduct: Record<string, KpiThreshold[]>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q) ||
        p.product_type?.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Product catalog</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} products · live 30-day KPIs
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <CatalogEmpty />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCatalogCard
              key={product.product_id}
              product={product}
              health={computeProductHealth(
                product,
                thresholdsByProduct[product.product_id] ?? []
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
