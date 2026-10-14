"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { InventoryLocationRow } from "@/types/analysis";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

const chartConfig = {
  stock_value: { label: "Stock value", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Stock value on hand by location (SPEC-102) — the inventory parallel to the
 * Product Analyst "Revenue by category" chart, same token/chart conventions.
 * Shows where working capital is tied up across stores + the warehouse. */
export function LocationValueChart({ locations }: { locations: InventoryLocationRow[] }) {
  const data = locations.filter((l) => l.stock_value > 0);
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock value by location</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
              width={64}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
            />
            <Bar
              dataKey="stock_value"
              fill="var(--color-stock_value)"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
