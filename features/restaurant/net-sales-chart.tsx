"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Panel } from "@/components/shared/panel";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { periodLabel } from "@/lib/restaurant";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

const config = { netSales: { label: "Net sales", color: "var(--chart-1)" } } satisfies ChartConfig;

/** Net sales by business day for the period (backend SPEC-389 `trend`). */
export function NetSalesChart({ points }: { points: { date: string; netSales: number; transactions: number }[] }) {
  const data = points.map((p) => ({ ...p, day: periodLabel(p.date, p.date) }));
  return (
    <Panel title="Net sales" count="by business day">
      <div className="px-2 pt-3 pb-1">
        {data.length === 0 ? (
          <p className="px-2 py-16 text-center text-sm text-muted-foreground">No completed orders in this period yet.</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeOpacity={0.4} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} tickMargin={4} width={52} tickFormatter={(v: number) => formatCompactCurrency(v)} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums text-foreground">{formatCurrency(Number(value))}</span>
                    )}
                  />
                }
              />
              <Line dataKey="netSales" type="monotone" stroke="var(--color-netSales)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </Panel>
  );
}
