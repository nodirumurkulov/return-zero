"use client";
import { useState } from "react";
import FitScoreRow from "./FitScoreRow";
import type { FitScore } from "@/lib/api";

type GradeFilter = "all" | "F" | "D" | "C" | "B" | "A";

interface Props {
  scores: FitScore[];
  preloadedRecs: Record<string, string>;
}

export default function FitScoreTable({ scores, preloadedRecs }: Props) {
  const [filter, setFilter] = useState<GradeFilter>("all");

  const filtered = filter === "all"
    ? scores
    : scores.filter((p) => p.fit_score === filter);

  const counts = { F: 0, D: 0, C: 0, B: 0, A: 0 };
  scores.forEach((p) => counts[p.fit_score]++);

  const GRADE_CHIP_STYLE: Record<string, string> = {
    F: "bg-red-100    text-red-700",
    D: "bg-orange-100 text-orange-700",
    C: "bg-yellow-100 text-yellow-700",
    B: "bg-blue-100   text-blue-700",
    A: "bg-green-100  text-green-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Table toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-1.5">
          {(["all", "F", "D", "C", "B", "A"] as GradeFilter[]).map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filter === g
                  ? g === "all"
                    ? "bg-pf-black text-white"
                    : GRADE_CHIP_STYLE[g] + " ring-2 ring-offset-1 ring-current"
                  : g === "all"
                  ? "text-gray-500 hover:text-pf-black"
                  : `${GRADE_CHIP_STYLE[g]} opacity-60 hover:opacity-100`
              }`}
            >
              {g === "all" ? "All" : `Grade ${g}`}
              {g !== "all" && (
                <span className="ml-1 font-mono opacity-70">{counts[g]}</span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {filter !== "all" && ` · grade ${filter}`}
        </p>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["Product", "Score", "Return Rate", "Bias", "Stockouts", "AI Fix", ""].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-[10px] font-semibold uppercase
                           tracking-label text-gray-400 first:pl-5 last:pr-5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <FitScoreRow
              key={p.product_id}
              product={p}
              preloadedRec={preloadedRecs[p.product_id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
