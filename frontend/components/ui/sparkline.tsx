"use client";

import { useId } from "react";
import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer } from "recharts";

type SparklineProps = {
  data: number[];
  className?: string;
  stroke?: string;
  target?: number;
};

export default function Sparkline({
  data,
  className,
  stroke = "hsl(var(--primary))",
  target,
}: SparklineProps) {
  const fillId = useId();
  const chartData = data.map((value, index) => ({ index, value }));

  if (chartData.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.14} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill={`url(#${fillId})`}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
          {target != null && (
            <ReferenceLine
              y={target}
              stroke="hsl(var(--sev-low))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
