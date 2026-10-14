"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ClarityFrictionDay } from "@/types/clarity";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CONFIG: ChartConfig = {
  friction: { label: "Friction events", color: "var(--chart-1)" },
  sessions: { label: "Sessions", color: "var(--chart-2)" },
};

/** One page's friction by day against its sessions (SPEC-282) — bars for the
 * events, a line for the traffic, so a bad day reads as bad and not as busy. */
export function WebsiteFrictionChart({ days }: { days: ClarityFrictionDay[] }) {
  if (days.length === 0) return null;
  const rows = days.map((d) => ({ date: shortDate(d.capturedOn), friction: d.frictionEvents, sessions: d.sessions }));
  return (
    <ChartContainer config={CONFIG} className="h-[240px] w-full">
      <ComposedChart data={rows} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis yAxisId="f" tickLine={false} axisLine={false} width={36} fontSize={11} allowDecimals={false} />
        <YAxis yAxisId="s" orientation="right" tickLine={false} axisLine={false} width={40} fontSize={11} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar yAxisId="f" dataKey="friction" fill="var(--color-friction)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line yAxisId="s" dataKey="sessions" type="monotone" stroke="var(--color-sessions)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ChartContainer>
  );
}
