"use client";

import { ChevronRight, LayoutGrid, List, Package } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import CatalogEmpty from "@/components/catalog/CatalogEmpty";
import { HealthBadge } from "@/components/catalog/HealthBadge";
import ProductCatalogCard from "@/components/catalog/ProductCatalogCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { computeProductHealth } from "@/lib/stores/analytics/catalog/health";
import { cn } from "@/lib/utils";
import type { HealthLevel, KpiThreshold, ProductMetric } from "@/types/catalog";

function ProductRow({ product, health }: { product: ProductMetric; health: HealthLevel }) {
  return (
    <Link
      href={`/catalog/${product.product_id}`}
      className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Package className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground group-hover:text-primary">
          {product.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <code className="font-mono">{product.product_id}</code>
          <span className="size-1 rounded-full bg-muted-foreground/30" />
          <span className="capitalize">{product.product_type}</span>
        </div>
      </div>
      <HealthBadge level={health} />
      <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
    </Link>
  );
}

export default function CatalogGrid({
  products,
  thresholdsByProduct,
}: {
  products: ProductMetric[];
  thresholdsByProduct: Record<string, KpiThreshold[]>;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q) ||
        p.product_type?.toLowerCase().includes(q),
    );
  }, [products, query]);

  const healthOf = (p: ProductMetric) =>
    computeProductHealth(p, thresholdsByProduct[p.product_id] ?? []);

  const toggleCls = (active: boolean) =>
    `flex size-7 items-center justify-center rounded-md transition-colors ${
      active ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Product catalog</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {products.length} products · live 30-day KPIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="max-w-xs"
          />
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
            <button type="button" aria-label="List view" onClick={() => setView("list")} className={toggleCls(view === "list")}>
              <List className="size-4" />
            </button>
            <button type="button" aria-label="Grid view" onClick={() => setView("grid")} className={toggleCls(view === "grid")}>
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <CatalogEmpty />
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {filtered.map((product, index) => (
            <div
              key={product.product_id}
              className={cn(
                index === 0 && "md:col-span-2 lg:col-span-1 lg:row-span-2",
              )}
            >
              <ProductCatalogCard product={product} health={healthOf(product)} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="gap-0 divide-y divide-border p-0">
          {filtered.map((product) => (
            <ProductRow key={product.product_id} product={product} health={healthOf(product)} />
          ))}
        </Card>
      )}
    </div>
  );
}
