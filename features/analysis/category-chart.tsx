"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategoryPerformance } from "@/types/analysis";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/** Revenue by category (SPEC-026 §3) — same token/chart conventions as the
 * dashboard's revenue chart. */
export function CategoryChart({ categories }: { categories: CategoryPerformance[] }) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue by category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-sm text-muted-foreground">
            No categorized sales in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={categories} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
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
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
