"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { PerformanceSnapshot } from "@/types/customer-support";

export type TrendMetric = "csat" | "frt";

const CONFIG: ChartConfig = {
  agent: { label: "Agent", color: "var(--chart-2)" },
  team: { label: "Team", color: "var(--chart-1)" },
};

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** The agent and the team, day by day (SPEC-346) — CSAT or first-response minutes. */
export function PerformanceChart({ trend, metric }: { trend: PerformanceSnapshot["trend"]; metric: TrendMetric }) {
  const rows = trend.map((point) => ({
    date: shortDate(point.date),
    agent: metric === "csat" ? point.agentCsat : point.agentFrt,
    team: metric === "csat" ? point.humanCsat : point.humanFrt,
  }));
  return (
    <ChartContainer config={CONFIG} className="h-[240px] w-full">
      <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          fontSize={11}
          domain={metric === "csat" ? [3, 5] : [0, "auto"]}
          unit={metric === "frt" ? "m" : undefined}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="agent" type="monotone" stroke="var(--color-agent)" strokeWidth={2} dot={false} connectNulls />
        <Line dataKey="team" type="monotone" stroke="var(--color-team)" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ChartContainer>
  );
}
