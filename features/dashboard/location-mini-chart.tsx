"use client";

import { Area, AreaChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { LocationKpiSeries } from "@/types/dashboard";
import { formatCurrency } from "@/utils/format";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface Props {
  series: LocationKpiSeries[];
  /** A 64×20 sparkline for a table cell (SPEC-233) instead of the 80px card chart. */
  compact?: boolean;
}

export function LocationMiniChart({ series, compact = false }: Props) {
  if (series.length === 0) {
    return compact ? (
      <span className="text-xs text-muted-foreground">—</span>
    ) : (
      <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={compact ? "aspect-auto h-5 w-16" : "h-20 w-full"}
    >
      <AreaChart data={series} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="locationRevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{item.payload.label}</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          fill="url(#locationRevFill)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
