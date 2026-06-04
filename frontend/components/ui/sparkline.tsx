"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type SparklineProps = {
  data: number[];
  className?: string;
  stroke?: string;
};

export default function Sparkline({
  data,
  className,
  stroke = "hsl(var(--primary))",
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  if (chartData.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
