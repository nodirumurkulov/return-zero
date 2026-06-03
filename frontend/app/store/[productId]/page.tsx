"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import NavBar from "@/components/ui/NavBar";
import SizeSelector from "@/components/store/SizeSelector";
import SizingWidget from "@/components/store/SizingWidget";
import { fetchProduct, type ProductDetail } from "@/lib/api";

const TYPE_BG: Record<string, string> = {
  Trainer:    "from-stone-100 to-stone-200",
  Hoodie:     "from-zinc-100  to-zinc-200",
  Tee:        "from-slate-100 to-slate-200",
  Cap:        "from-neutral-100 to-neutral-200",
  Sweatpants: "from-gray-100  to-gray-200",
  Outerwear:  "from-stone-200 to-stone-300",
};

const TYPE_GLYPH: Record<string, string> = {
  Trainer: "👟", Hoodie: "🧥", Tee: "👕",
  Cap: "🧢", Sweatpants: "👖", Outerwear: "🥼",
};

function ReturnBar({ label, count, total, colour }: {
  label: string; count: number; total: number; colour: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className="font-mono">{count} customers ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { productId }         = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(productId)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pf-white">
        <NavBar />
        <main className="max-w-5xl mx-auto px-8 py-12">
          <div className="grid grid-cols-2 gap-16 animate-pulse">
            <div className="aspect-[3/4] bg-gray-100 rounded-xl" />
            <div className="space-y-4 pt-4">
              <div className="h-8 bg-gray-100 rounded w-2/3" />
              <div className="h-5 bg-gray-100 rounded w-1/4" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) return null;

  const bg    = TYPE_BG[product.product_type]    ?? "from-stone-100 to-stone-200";
  const glyph = TYPE_GLYPH[product.product_type] ?? "📦";
  const highRisk = product.fit_score === "F" || product.fit_score === "D";
  const total = product.size_too_small + product.size_too_large;

  return (
    <div className="min-h-screen bg-pf-white">
      <NavBar />

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/store" className="hover:text-pf-black transition-colors">All products</Link>
          <span>/</span>
          <span className="text-pf-charcoal">{product.product_type}s</span>
          <span>/</span>
          <span className="text-pf-black">{product.title}</span>
        </div>

        <div className="grid grid-cols-2 gap-16">
          {/* Left: Image */}
          <div className="sticky top-20">
            <div
              className={clsx(
                "aspect-[3/4] rounded-2xl bg-gradient-to-br flex items-center justify-center",
                bg
              )}
            >
              <span className="text-8xl opacity-25 select-none">{glyph}</span>
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-6 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-label text-gray-400 mb-1">
                {product.product_type}
              </p>
              <h1 className="text-3xl font-black tracking-tighter leading-tight">
                {product.title}
              </h1>
              <p className="text-xl font-medium text-pf-charcoal mt-2">
                £{product.price.toFixed(0)}
              </p>
            </div>

            {/* Sizing alert */}
            {highRisk && (
              <div
                className={clsx(
                  "rounded-xl p-4 border-l-4 text-sm",
                  product.fit_score === "F"
                    ? "bg-red-50 border-grade-f"
                    : "bg-orange-50 border-grade-d"
                )}
              >
                <p className={clsx("font-semibold mb-1",
                  product.fit_score === "F" ? "text-red-700" : "text-orange-700"
                )}>
                  ⚠ This {product.product_type.toLowerCase()} runs{" "}
                  {product.size_bias === "runs_small" ? "small" : "large"}
                </p>
                <p className={clsx("text-xs leading-relaxed",
                  product.fit_score === "F" ? "text-red-600" : "text-orange-600"
                )}>
                  {product.sizing_return_rate}% of buyers returned for size.{" "}
                  Use the sizing assistant below before ordering.
                </p>
              </div>
            )}

            {/* Colour swatches */}
            {product.colour_hexes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-label text-gray-400 mb-2.5">
                  Colour
                </p>
                <div className="flex items-center gap-2">
                  {product.colour_hexes.map((hex, i) => (
                    <button
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-transparent
                                 hover:border-pf-black transition-colors first:border-pf-black"
                      style={{ backgroundColor: hex }}
                      title={product.colours[i]}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            <SizeSelector
              sizes={Object.keys(product.inventory_by_size)}
              inventory={product.inventory_by_size}
            />

            {/* CTA */}
            <button className="w-full h-14 bg-pf-black text-white font-medium text-sm
                               rounded-xl hover:bg-pf-charcoal transition-colors tracking-wide">
              Add to Bag
            </button>

            {/* Return data strip */}
            {total > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-label text-gray-400">
                  Return history for this product
                </p>
                <ReturnBar
                  label="Found it too small"
                  count={product.size_too_small}
                  total={total}
                  colour="#DC2626"
                />
                <ReturnBar
                  label="Found it too large"
                  count={product.size_too_large}
                  total={total}
                  colour="#EA580C"
                />
                <p className="text-[11px] text-gray-400 pt-1">
                  Based on {total.toLocaleString()} sizing returns from {product.units_sold.toLocaleString()} units sold
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SizingWidget product={product} />
    </div>
  );
}
