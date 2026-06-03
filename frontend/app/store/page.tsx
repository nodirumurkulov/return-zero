"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/ui/NavBar";
import ProductCard from "@/components/store/ProductCard";
import { fetchProducts, type ProductSummary } from "@/lib/api";

export default function StorePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"all" | "mens" | "womens">("all");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? products
    : products.filter((p) => p.gender_segment === filter);

  return (
    <div className="min-h-screen bg-pf-white">
      <NavBar />

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">All Products</h1>
            <p className="text-sm text-gray-400 mt-1">
              {filtered.length} products · Sizing data from 2,393 real returns
            </p>
          </div>

          {/* Gender filter */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "mens", "womens"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
                  filter === g
                    ? "bg-white text-pf-black shadow-sm"
                    : "text-gray-500 hover:text-pf-black"
                }`}
              >
                {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-xl bg-gray-100 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            {filtered.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
