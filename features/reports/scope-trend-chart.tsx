"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ScopeTrendChartProps {
  data: { date: string; revenue: number; orders: number }[];
}

/** 7-day revenue trend for a brand/location report (SPEC-034). Data arrives
 * computed from the backend; this component only draws it. */
export function ScopeTrendChart({ data }: ScopeTrendChartProps) {
  const points = data.map((point) => ({
    ...point,
    day: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }),
  }));
  return (
    <ChartContainer config={chartConfig} className="h-44 w-full">
      <BarChart
        accessibilityLayer
        data={points}
        margin={{ left: 4, right: 12, top: 8 }}
      >
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={48}
          tickFormatter={(value: number) => formatCompactCurrency(value)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span>
                    {formatCurrency(Number(value))} ·{" "}
                    {(item.payload as { orders: number }).orders} orders
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
