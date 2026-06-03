"use client";
import { useState } from "react";
import clsx from "clsx";

interface Props {
  sizes: string[];
  inventory: Record<string, number>;
}

// Sort sizes in logical order
function sortSizes(sizes: string[]): string[] {
  const clothOrder = ["XS", "S", "M", "L", "XL", "XXL", "ONE"];
  const trainerOrder = ["UK6", "UK7", "UK8", "UK9", "UK10", "UK11", "UK12"];

  if (sizes.some((s) => s.startsWith("UK"))) {
    return trainerOrder.filter((s) => sizes.includes(s));
  }
  const sorted = clothOrder.filter((s) => sizes.includes(s));
  // anything not in the order appended at the end
  const rest = sizes.filter((s) => !clothOrder.includes(s));
  return [...sorted, ...rest];
}

export default function SizeSelector({ sizes, inventory }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const sorted = sortSizes(sizes);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-label text-gray-500">
          Size
        </span>
        {selected && (
          <span className="text-xs text-gray-400">
            {(inventory[selected] ?? 0) > 0
              ? `${inventory[selected]} in stock`
              : "Out of stock"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sorted.map((size) => {
          const qty = inventory[size] ?? 0;
          const isOut = qty <= 0;
          const isLow = qty > 0 && qty < 10;
          const isSelected = selected === size;

          return (
            <button
              key={size}
              onClick={() => !isOut && setSelected(size)}
              disabled={isOut}
              className={clsx(
                "relative min-w-[48px] h-10 px-3 text-sm rounded-lg border transition-all duration-150",
                isSelected && "bg-pf-black text-white border-pf-black",
                !isSelected && !isOut && [
                  "bg-white text-pf-black border-pf-dust",
                  "hover:border-pf-charcoal",
                ],
                isOut && "line-through text-gray-300 border-gray-100 cursor-not-allowed opacity-40"
              )}
            >
              {size}
              {/* Low-stock dot */}
              {isLow && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-grade-f" />
              )}
            </button>
          );
        })}
      </div>

      {/* Stockout legend */}
      {sorted.some((s) => (inventory[s] ?? 0) <= 0) && (
        <p className="text-[11px] text-gray-400 mt-2">
          <span className="line-through">size</span> = out of stock
        </p>
      )}
    </div>
  );
}
