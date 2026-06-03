"use client";
import Link from "next/link";
import clsx from "clsx";
import type { ProductSummary } from "@/lib/api";

// Map product type → background gradient (warm cream tones from brand)
const TYPE_BG: Record<string, string> = {
  Trainer:    "from-stone-100 to-stone-200",
  Hoodie:     "from-zinc-100  to-zinc-200",
  Tee:        "from-slate-100 to-slate-200",
  Cap:        "from-neutral-100 to-neutral-200",
  Sweatpants: "from-gray-100  to-gray-200",
  Outerwear:  "from-stone-200 to-stone-300",
};

// Map product type → large placeholder initial / icon
const TYPE_GLYPH: Record<string, string> = {
  Trainer:    "👟",
  Hoodie:     "🧥",
  Tee:        "👕",
  Cap:        "🧢",
  Sweatpants: "👖",
  Outerwear:  "🥼",
};

interface Props { product: ProductSummary }

export default function ProductCard({ product }: Props) {
  const needsWarning = product.fit_score === "F" || product.fit_score === "D";
  const bg = TYPE_BG[product.product_type] ?? "from-stone-100 to-stone-200";
  const glyph = TYPE_GLYPH[product.product_type] ?? "📦";

  return (
    <Link
      href={`/store/${product.product_id}`}
      className="group flex flex-col gap-3"
    >
      {/* Image / placeholder */}
      <div
        className={clsx(
          "relative aspect-[3/4] rounded-xl bg-gradient-to-br overflow-hidden",
          "transition-transform duration-200 group-hover:scale-[1.02]",
          bg
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl opacity-30 select-none">{glyph}</span>
        </div>

        {/* Sizing warning badge */}
        {needsWarning && (
          <div className="absolute top-3 right-3">
            <span
              className={clsx(
                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
                "px-2 py-1 rounded-full",
                product.fit_score === "F"
                  ? "bg-red-600 text-white"
                  : "bg-orange-500 text-white"
              )}
            >
              ⚠ {product.fit_score === "F" ? "Check Sizing" : "Size Advice"}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 bg-pf-black/0 group-hover:bg-pf-black/5
                     transition-colors duration-200"
        />
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-pf-black truncate leading-snug">
            {product.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {product.size_bias !== "unknown"
              ? product.size_bias.replace("_", " ")
              : product.product_type.toLowerCase()}
          </p>
        </div>
        <p className="text-sm font-medium text-pf-charcoal whitespace-nowrap">
          £{product.price.toFixed(0)}
        </p>
      </div>

      {/* Colour swatches */}
      {product.colour_hexes.length > 0 && (
        <div className="flex items-center gap-1.5">
          {product.colour_hexes.slice(0, 5).map((hex, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
              style={{ backgroundColor: hex }}
              title={product.colours?.[i]}
            />
          ))}
          {product.colour_hexes.length > 5 && (
            <span className="text-[10px] text-gray-400">
              +{product.colour_hexes.length - 5}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
