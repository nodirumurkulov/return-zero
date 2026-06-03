"use client";
import { useState } from "react";
import clsx from "clsx";
import Badge, { Pill } from "@/components/ui/Badge";
import { fetchRecommendation } from "@/lib/api";
import type { FitScore } from "@/lib/api";

const BIAS_VARIANT: Record<string, "warning" | "neutral" | "success" | "muted"> = {
  runs_small:   "warning",
  runs_large:   "neutral",
  true_to_size: "success",
  unknown:      "muted",
};

const BIAS_LABEL: Record<string, string> = {
  runs_small:   "Runs small",
  runs_large:   "Runs large",
  true_to_size: "True to size",
  unknown:      "Unknown",
};

interface Props {
  product: FitScore;
  preloadedRec?: string;
}

export default function FitScoreRow({ product, preloadedRec }: Props) {
  const [rec, setRec]         = useState<string | null>(preloadedRec ?? null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const needsFix = product.fit_score === "F" || product.fit_score === "D";
  const isWorst  = product.fit_score === "F";

  async function loadRec() {
    if (rec || loading || !needsFix) return;
    setLoading(true);
    try {
      const r = await fetchRecommendation(product.product_id);
      setRec(r);
    } finally {
      setLoading(false);
    }
  }

  const total = product.size_too_small + product.size_too_large;

  return (
    <>
      <tr
        className={clsx(
          "border-b border-gray-50 transition-colors cursor-pointer",
          isWorst ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-gray-50"
        )}
        onClick={() => setExpanded((x) => !x)}
      >
        {/* Product */}
        <td className="px-5 py-3.5">
          <p className="text-sm font-semibold text-pf-black leading-snug">{product.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{product.product_type}</p>
        </td>

        {/* Score */}
        <td className="px-4 py-3.5">
          <Badge grade={product.fit_score} size="md" />
        </td>

        {/* Return rate */}
        <td className="px-4 py-3.5">
          <span
            className={clsx(
              "font-mono text-sm font-semibold",
              product.fit_score === "F" && "text-grade-f",
              product.fit_score === "D" && "text-grade-d",
              product.fit_score === "C" && "text-grade-c",
              product.fit_score === "B" && "text-grade-b",
              product.fit_score === "A" && "text-grade-a"
            )}
          >
            {product.sizing_return_rate.toFixed(1)}%
          </span>
        </td>

        {/* Bias */}
        <td className="px-4 py-3.5">
          <Pill
            label={BIAS_LABEL[product.size_bias] ?? product.size_bias}
            variant={BIAS_VARIANT[product.size_bias] ?? "muted"}
          />
        </td>

        {/* Stockouts */}
        <td className="px-4 py-3.5">
          {product.stockout_sizes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {product.stockout_sizes.map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-mono font-semibold text-grade-f
                             bg-red-50 border border-red-200 rounded px-1.5 py-0.5"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>

        {/* AI Fix */}
        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
          {needsFix ? (
            rec ? (
              <p className="text-xs text-gray-600 italic max-w-[200px] leading-relaxed">{rec}</p>
            ) : (
              <button
                onClick={loadRec}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 underline
                           underline-offset-2 transition-colors disabled:opacity-40"
              >
                {loading ? "Generating…" : "Generate fix →"}
              </button>
            )
          ) : (
            <span className="text-gray-200 text-sm">—</span>
          )}
        </td>

        {/* Expand chevron */}
        <td className="pr-5 py-3.5 w-6 text-right">
          <span
            className={clsx(
              "text-gray-300 text-xs transition-transform inline-block",
              expanded && "rotate-180"
            )}
          >
            ▾
          </span>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className={clsx("border-b border-gray-50", isWorst ? "bg-red-50/20" : "bg-gray-50/50")}>
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Inventory by size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-label text-gray-400 mb-2">
                  Inventory by size
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(product.inventory_by_size).map(([size, qty]) => (
                    <div
                      key={size}
                      className={clsx(
                        "text-xs font-mono rounded px-2 py-1 border",
                        qty < 0
                          ? "bg-red-50 text-grade-f border-red-200 font-semibold"
                          : qty < 20
                          ? "bg-orange-50 text-grade-d border-orange-100"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      )}
                    >
                      {size}: {qty > 0 ? `+${qty}` : qty}
                    </div>
                  ))}
                </div>
              </div>

              {/* Return breakdown bars */}
              {total > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-label text-gray-400 mb-2">
                    Return breakdown
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Too small", count: product.size_too_small, colour: "#DC2626" },
                      { label: "Too large", count: product.size_too_large, colour: "#EA580C" },
                    ].map(({ label, count, colour }) => {
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{label}</span>
                            <span className="font-mono">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: colour }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
