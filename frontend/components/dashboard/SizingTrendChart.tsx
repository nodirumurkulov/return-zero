"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Label,
} from "recharts";

// Pre-computed from data — hardcoded for demo reliability (no API needed)
const DATA = [
  { quarter: "Q2 '24", refunds: 63 },
  { quarter: "Q3 '24", refunds: 205 },
  { quarter: "Q4 '24", refunds: 330 },
  { quarter: "Q1 '25", refunds: 282 },
  { quarter: "Q2 '25", refunds: 275 },
  { quarter: "Q3 '25", refunds: 263 },
  { quarter: "Q4 '25", refunds: 417 },
  { quarter: "Q1 '26", refunds: 336 },
  { quarter: "Q2 '26", refunds: 222 },
];

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
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-pf-black">Sizing refunds over time</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Q4 2025 hit 417 — up 26% on Q4 2024. Getting worse as they scale.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-red-50 text-grade-f
                         border border-red-100 rounded-full px-3 py-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-grade-f inline-block" />
          +26% YoY
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={DATA} margin={{ top: 4, right: 12, bottom: 0, left: -8 }}>
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
          <ReferenceLine y={330} stroke="#FCA5A5" strokeDasharray="4 3" strokeWidth={1.5}>
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
    </div>
  );
}
