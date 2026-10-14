"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Panel } from "@/components/shared/panel";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { RevenuePoint } from "@/types/analytics";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

interface RevenueChartProps {
  data: RevenuePoint[];
  /** Legend/tooltip names (SPEC-037) — e.g. "Last 7 days" / "Previous period". */
  currentLabel?: string;
  previousLabel?: string;
  /** False hides the comparison line entirely (compare=none). */
  showPrevious?: boolean;
}

export function RevenueChart({
  data,
  currentLabel = "This Week",
  previousLabel = "Last Week",
  showPrevious = true,
}: RevenueChartProps) {
  const chartConfig = {
    current: {
      label: currentLabel,
      color: "var(--chart-1)",
    },
    previous: {
      label: previousLabel,
      color: "var(--muted-foreground)",
    },
  } satisfies ChartConfig;

  // The adapter emits hour points for a single day ("T" in the ISO date) and day
  // points otherwise — the same rule `lib/adapters.ts` uses to label the axis.
  const grain = data[0]?.date.includes("T") ? "hourly" : "daily";

  return (
    <Panel
      title="Revenue"
      count={grain}
      aside={
        <span className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-chart-1" aria-hidden />
            {currentLabel}
          </span>
          {showPrevious && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />
              {previousLabel}
            </span>
          )}
        </span>
      }
    >
      <div className="px-2 pt-3 pb-1">
        <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 4, right: 12, top: 8 }}
          >
            <CartesianGrid vertical={false} strokeOpacity={0.4} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
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
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: item.color }}
                          aria-hidden
                        />
                        {chartConfig[name as keyof typeof chartConfig].label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="current"
              type="monotone"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {showPrevious && (
              <Line
                dataKey="previous"
                type="monotone"
                stroke="var(--color-previous)"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </div>
    </Panel>
  );
}
