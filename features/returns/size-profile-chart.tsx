"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRate, rateTone, type RateTone } from "@/lib/returns-format";
import type { SizeProfileCell } from "@/types/returns-intel";
import { formatNumber } from "@/utils/format";

/** Rate severity → bar fill (semantic tokens, both themes). Critical sizes glow
 * red so the systemic offenders pop instantly. */
const TONE_FILL: Record<RateTone, { fill: string; opacity: number }> = {
  critical: { fill: "var(--destructive)", opacity: 1 },
  high: { fill: "var(--warning)", opacity: 1 },
  medium: { fill: "var(--warning)", opacity: 0.6 },
  low: { fill: "var(--primary)", opacity: 0.5 },
  none: { fill: "var(--muted-foreground)", opacity: 0.3 },
};

const chartConfig = { rate: { label: "Return rate" } } satisfies ChartConfig;

/** Store-wide "return rate by size" (SPEC-087 Patch) — every size cell
 * aggregated across all styles, so a size that runs small/large across the
 * whole catalog jumps out. The merchandising signal per-style grids can't show.
 */
export function SizeProfileChart({ profile }: { profile?: SizeProfileCell[] | null }) {
  // Defensive: an older backend build (or a transient error) may omit
  // `size_profile` — render nothing rather than crash the Sizing tab.
  const data = (profile ?? [])
    .filter((c) => c.return_rate !== null)
    .map((c) => ({
      size: c.size,
      rate: Math.round((c.return_rate ?? 0) * 1000) / 10,
      sold: c.units_sold,
      returned: c.units_returned,
      tone: rateTone(c.return_rate),
    }));
  if (data.length === 0) return null;

  const worst = data.reduce((a, b) => (b.rate > a.rate ? b : a));

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle>Return rate by size</CardTitle>
        <p className="text-xs text-muted-foreground">
          Across every style — which sizes systematically come back.
          {worst.rate > 0
            ? ` ${worst.size} is the worst at ${formatRate(worst.rate / 100)}.`
            : ""}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="size"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}%`}
              width={44}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const p = item?.payload as { sold: number; returned: number } | undefined;
                    return `${value}% · ${p ? `${formatNumber(p.returned)} of ${formatNumber(p.sold)} returned` : ""}`;
                  }}
                />
              }
            />
            <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {data.map((d) => (
                <Cell
                  key={d.size}
                  fill={TONE_FILL[d.tone].fill}
                  fillOpacity={TONE_FILL[d.tone].opacity}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
