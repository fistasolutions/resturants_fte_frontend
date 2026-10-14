"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { storeVisitorsChart } from "@/lib/traffic-chart";
import { cn } from "@/lib/utils";
import type { TrafficStoreDaily } from "@/types/traffic";
import { formatNumber } from "@/utils/format";

type Metric = "visitors_in" | "visitors_out";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Per-store footfall over time (SPEC-112 Patches): one line per store, toggle
 * between walk-ins and walk-outs. Backend supplies the aligned series (Rule 8). */
export function StoreVisitorsChart({ storeDaily }: { storeDaily: TrafficStoreDaily }) {
  const [metric, setMetric] = useState<Metric>("visitors_in");

  if (!storeDaily.dates.length || !storeDaily.stores.length) return null;

  const { rows, series } = storeVisitorsChart(storeDaily, metric);
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.key, color: s.color }]),
  );

  return (
    <Card className="gap-4 px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            {metric === "visitors_in" ? "Visitors by store" : "Walk-outs by store"}
          </p>
          <h2 className="text-sm font-semibold">
            {metric === "visitors_in"
              ? "Who walked in, day by day"
              : "Who walked out, day by day"}
          </h2>
        </div>
        <div
          role="group"
          aria-label="Metric"
          className="inline-flex rounded-lg border border-border p-0.5"
        >
          {(
            [
              ["visitors_in", "Walk-ins"],
              ["visitors_out", "Walk-outs"],
            ] as [Metric, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              aria-pressed={metric === key}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                metric === key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.key}
          </span>
        ))}
      </div>

      <ChartContainer config={config} className="h-64 w-full">
        <LineChart accessibilityLayer data={rows} margin={{ left: 4, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={shortDate}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width={40}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            labelFormatter={(label) => shortDate(String(label))}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
