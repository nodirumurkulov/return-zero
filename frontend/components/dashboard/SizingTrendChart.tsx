"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from "recharts";
import { fetchTrend, type TrendPoint } from "@/lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-pf-black">{label}</p>
      <p className="text-grade-f mt-0.5">{payload[0].value} sizing refunds</p>
    </div>
  );
};

export default function SizingTrendChart() {
  const [data, setData]       = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [yoyLabel, setYoyLabel] = useState("+26% YoY");

  useEffect(() => {
    fetchTrend()
      .then((pts) => {
        setData(pts);
        // Compute YoY badge from live data
        const q4 = (year: number) =>
          pts.find((p) => p.quarter.includes(`${year} Q4`) || p.quarter === `${year}Q4`)?.refunds ?? 0;
        const prev = q4(2024), curr = q4(2025);
        if (prev > 0) {
          const pct = Math.round(((curr - prev) / prev) * 100);
          setYoyLabel(`${pct > 0 ? "+" : ""}${pct}% YoY`);
        }
      })
      .catch(() => {/* silently keep static fallback */})
      .finally(() => setLoading(false));
  }, []);

  // Baseline for reference line — Q4 2024 value
  const q4baseline = data.find(
    (p) => p.quarter.includes("2024 Q4") || p.quarter === "2024Q4"
  )?.refunds ?? 330;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-pf-black">Sizing refunds over time</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading
              ? "Loading trend data…"
              : "Q4 2025 is the worst quarter on record. Getting worse as the brand scales."}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-red-50 text-grade-f
                         border border-red-100 rounded-full px-3 py-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-grade-f inline-block" />
          {yoyLabel}
        </span>
      </div>

      {loading ? (
        <div className="h-[180px] bg-gray-50 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={q4baseline} stroke="#FCA5A5" strokeDasharray="4 3" strokeWidth={1.5}>
              <Label value="Q4 '24 baseline" position="insideTopRight"
                     style={{ fontSize: 9, fill: "#FCA5A5" }} />
            </ReferenceLine>
            <Line
              type="monotone"
              dataKey="refunds"
              stroke="#DC2626"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#DC2626", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#DC2626", stroke: "white", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
