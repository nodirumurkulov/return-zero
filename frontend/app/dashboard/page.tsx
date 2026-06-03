"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/ui/NavBar";
import StatCard from "@/components/ui/StatCard";
import FitScoreTable from "@/components/dashboard/FitScoreTable";
import SizingTrendChart from "@/components/dashboard/SizingTrendChart";
import { fetchFitScores, fetchRecommendation, fetchStats, type FitScore, type SiteStats } from "@/lib/api";

export default function DashboardPage() {
  const [scores, setScores]               = useState<FitScore[]>([]);
  const [siteStats, setSiteStats]         = useState<SiteStats | null>(null);
  const [loading, setLoading]             = useState(true);
  const [preloadedRecs, setPreloadedRecs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch fit scores + headline stats in parallel
    Promise.all([fetchFitScores(), fetchStats()])
      .then(async ([data, stats]) => {
        setScores(data);
        setSiteStats(stats);
        setLoading(false);

        // Pre-load AI fix recommendations for all F-grade products in background
        const fProducts = data.filter((p) => p.fit_score === "F");
        const recs: Record<string, string> = {};
        await Promise.all(
          fProducts.map(async (p) => {
            try {
              recs[p.product_id] = await fetchRecommendation(p.product_id);
            } catch {
              // silently skip — user can still click to generate
            }
          })
        );
        setPreloadedRecs(recs);
      })
      .catch(() => setLoading(false));
  }, []);

  const fCount = scores.filter((p) => p.fit_score === "F").length;
  const dCount = scores.filter((p) => p.fit_score === "D").length;

  const statVal = (val: number | undefined, fmt: (n: number) => string) =>
    loading || val === undefined ? "—" : fmt(val);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-6">

        {/* Headline stat cards — values from API */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Sizing losses (24 months)"
            value={statVal(siteStats?.total_sizing_loss, (n) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`)}
            sub={siteStats ? `${siteStats.total_sizing_count.toLocaleString()} refund incidents` : ""}
            alert
            alertColour="red"
          />
          <StatCard
            label="First-order refund risk"
            value={statVal(siteStats?.first_order_pct, (n) => `${n}%`)}
            sub={siteStats ? `${siteStats.first_order_count.toLocaleString()} first-time customers` : ""}
            alert
            alertColour="orange"
          />
          <StatCard
            label="Products graded F"
            value={loading ? "—" : String(fCount)}
            sub={loading ? "" : `${fCount + dCount} need action`}
            alert
            alertColour="red"
          />
          <StatCard
            label="Sizing refunds trend"
            value={statVal(siteStats?.yoy_pct, (n) => `${n > 0 ? "+" : ""}${n}% YoY`)}
            sub={siteStats ? `Q4 '24: ${siteStats.q4_2024_refunds} → Q4 '25: ${siteStats.q4_2025_refunds}` : ""}
            alert
            alertColour="orange"
          />
        </div>

        {/* Key insight callout */}
        <div className="bg-pf-black text-white rounded-xl p-5 flex items-center gap-6">
          <div className="text-4xl">🔗</div>
          <div>
            <p className="text-sm font-bold mb-1">
              The Court Trainer's return problem is a stock problem
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              22.5% sizing return rate → customers buy UK10, return for too small, rebuy UK11.
              Result: UK11 is at <span className="text-red-300 font-mono font-semibold">-153 units</span>,{" "}
              UK12 at <span className="text-red-300 font-mono font-semibold">-150</span>,{" "}
              UK6 at <span className="text-red-300 font-mono font-semibold">-149</span>.
              One product's sizing failure is driving your supply chain.
            </p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <a
              href="/store/prod_00005"
              className="text-xs border border-white/20 text-white/70 hover:text-white
                         hover:border-white/50 transition-colors rounded px-3 py-2 whitespace-nowrap"
            >
              View product →
            </a>
          </div>
        </div>

        {/* Trend chart */}
        <SizingTrendChart />

        {/* Fit Score table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-pf-black">Product Fit Scores</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Click any row to expand inventory + return breakdown
              </p>
            </div>
            {!loading && (
              <span className="text-xs bg-red-50 text-grade-f border border-red-100
                               rounded-full px-3 py-1 font-semibold">
                {fCount + dCount} products need attention
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8">
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="h-4 bg-gray-100 rounded w-48" />
                    <div className="h-6 w-7 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-16" />
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-4 bg-gray-100 rounded w-32" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <FitScoreTable scores={scores} preloadedRecs={preloadedRecs} />
          )}
        </div>

      </main>
    </div>
  );
}
