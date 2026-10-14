"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TrendPoint } from "@/types/email-marketing";

const CONFIG: ChartConfig = {
  attributed: { label: "Attributed", color: "var(--chart-3)" },
  incremental: { label: "Caused by email", color: "var(--chart-1)" },
  profit: { label: "Profit", color: "var(--chart-2)" },
};

/** Weekly email revenue: what the platform attributes, what email caused, and the profit. */
export function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const rows = trend.map((p) => ({ ...p, week: new Date(`${p.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
  if (rows.length === 0) {
    return (
      <div className="grid h-[260px] place-items-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
        <p className="max-w-sm px-4">No weekly money to chart yet — it fills in once sends have results.</p>
      </div>
    );
  }
  return (
    <ChartContainer config={CONFIG} className="h-[260px] w-full">
      <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={48} fontSize={11} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="attributed" type="monotone" stroke="var(--color-attributed)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        <Line dataKey="incremental" type="monotone" stroke="var(--color-incremental)" strokeWidth={2} dot={false} />
        <Line dataKey="profit" type="monotone" stroke="var(--color-profit)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
