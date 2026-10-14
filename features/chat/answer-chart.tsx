"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  axisLabel,
  chartCaption,
  chartRows,
  dateLabel,
  formatAxis,
  formatValue,
} from "@/lib/answer-visual";
import { cn } from "@/lib/utils";
import type { AnswerVisual } from "@/types/chat";

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-3)"] as const;

/**
 * The chart an answer carries (SPEC-257): a ranking as horizontal bars, a trend
 * as a line, a comparison as grouped bars — drawn from `sources.visual`, the
 * backend's spec over the tools' own numbers (backend SPEC-259).
 */
export function AnswerChart({ visual, compact = false }: { visual: AnswerVisual; compact?: boolean }) {
  const rows = chartRows(visual);
  const config: ChartConfig = Object.fromEntries(
    visual.series.map((series, index) => [
      `s${index}`,
      { label: series.name, color: SERIES_COLORS[index % SERIES_COLORS.length] },
    ]),
  );
  const height = compact ? "h-[180px]" : "h-[220px]";
  const tooltip = (
    <ChartTooltip
      content={
        <ChartTooltipContent
          formatter={(value, name) => (
            <span className="flex w-full items-center justify-between gap-3">
              <span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span>
              <span className="font-mono font-medium tabular-nums">
                {formatValue(visual.unit, Number(value))}
              </span>
            </span>
          )}
        />
      }
    />
  );

  return (
    <figure data-answer-chart className="space-y-1.5">
      <figcaption className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {visual.title}
      </figcaption>
      <ChartContainer config={config} className={cn("w-full", height)}>
        {visual.kind === "line" ? (
          <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickFormatter={dateLabel}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              tickFormatter={(value: number) => formatAxis(visual.unit, value)}
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={11}
            />
            {tooltip}
            <Line dataKey="s0" type="monotone" stroke="var(--color-s0)" strokeWidth={2} dot={false} />
          </LineChart>
        ) : visual.kind === "compare" ? (
          <BarChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis
              tickFormatter={(value: number) => formatAxis(visual.unit, value)}
              tickLine={false}
              axisLine={false}
              width={48}
              fontSize={11}
            />
            {tooltip}
            <ChartLegend content={<ChartLegendContent />} />
            {visual.series.map((_, index) => (
              <Bar key={index} dataKey={`s${index}`} fill={`var(--color-s${index})`} radius={4} />
            ))}
          </BarChart>
        ) : (
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value: number) => formatAxis(visual.unit, value)}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickFormatter={(value: string) => axisLabel(value, compact ? 16 : 22)}
              tickLine={false}
              axisLine={false}
              width={compact ? 110 : 150}
              fontSize={11}
            />
            {tooltip}
            <Bar dataKey="s0" fill="var(--color-s0)" radius={4} />
          </BarChart>
        )}
      </ChartContainer>
      <p className="text-[11px] text-muted-foreground">{chartCaption(visual)}</p>
    </figure>
  );
}
