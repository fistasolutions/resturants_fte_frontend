"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrafficStoreDetail } from "@/types/traffic";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CONFIG: ChartConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  conversion: { label: "Conversion %", color: "var(--chart-2)" },
};

/** This store's footfall + conversion over the range (SPEC-101 Patch) — two
 * axes so the volume line and the conversion line each read clearly. */
export function StoreDailyChart({ daily }: { daily: TrafficStoreDetail["daily"] }) {
  if (daily.length === 0) return null;
  const rows = daily.map((d) => ({
    date: shortDate(d.date),
    visitors: d.visitors,
    conversion: d.conversion_rate != null ? Math.round(d.conversion_rate * 1000) / 10 : null,
  }));

  return (
    <ChartContainer config={CONFIG} className="h-[240px] w-full">
      <LineChart data={rows} margin={{ left: 4, right: 4, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis
          yAxisId="v"
          tickLine={false}
          axisLine={false}
          width={36}
          fontSize={11}
        />
        <YAxis
          yAxisId="c"
          orientation="right"
          tickLine={false}
          axisLine={false}
          width={40}
          fontSize={11}
          unit="%"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          yAxisId="v"
          dataKey="visitors"
          type="monotone"
          stroke="var(--color-visitors)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="c"
          dataKey="conversion"
          type="monotone"
          stroke="var(--color-conversion)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}
