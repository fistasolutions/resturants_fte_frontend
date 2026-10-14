import { Clock, Moon, Sun, TrendingDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { HeatmapInfo } from "@/features/traffic/heatmap-info";
import { TrafficEmpty } from "@/features/traffic/traffic-empty";
import { formatConversion, hourLabel } from "@/lib/conversion";
import { WEEKDAY_LABELS, buildHeatmap, intensityClass } from "@/lib/traffic-heatmap";
import type { TrafficPeakHours } from "@/types/traffic";
import { formatCurrency, formatNumber } from "@/utils/format";

function Tile({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "warning";
}) {
  const ring = tone === "warning" ? "border-warning/30 bg-warning/5" : "border-border bg-card";
  const iconTone = tone === "warning" ? "text-warning" : "text-muted-foreground";
  return (
    <Card className={`gap-1 border px-4 py-3 ${ring}`}>
      <div className="flex items-center gap-1.5">
        <span className={iconTone}>{icon}</span>
        <p className="min-w-0 flex-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <ExplainButton placement="inline" target={{ metric: label, value, detail: sub }} />
      </div>
      <p className="text-lg font-semibold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export function PeakHoursView({ data }: { data: TrafficPeakHours | null }) {
  if (!data || !data.has_data) return <TrafficEmpty connected={Boolean(data?.last_sync)} />;

  const grid = buildHeatmap(data.heatmap);
  const lost = data.lost_hours;

  return (
    <div className="space-y-4">
      {/* Insight tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.peak && (
          <Tile
            icon={<Sun className="size-4" aria-hidden />}
            label="Busiest hour"
            value={`${WEEKDAY_LABELS[data.peak.weekday]} ${hourLabel(data.peak.hour)}`}
            sub={`${formatNumber(data.peak.visitors)} visitors`}
          />
        )}
        {data.busiest_day && (
          <Tile
            icon={<Clock className="size-4" aria-hidden />}
            label="Busiest day"
            value={WEEKDAY_LABELS[data.busiest_day.weekday]}
            sub={`${formatNumber(data.busiest_day.visitors)} visitors`}
          />
        )}
        {data.quiet && (
          <Tile
            icon={<Moon className="size-4" aria-hidden />}
            label="Quietest hour"
            value={`${WEEKDAY_LABELS[data.quiet.weekday]} ${hourLabel(data.quiet.hour)}`}
            sub={`${formatNumber(data.quiet.visitors)} visitors`}
          />
        )}
        <Tile
          tone={lost.total_lost > 0 ? "warning" : "default"}
          icon={<TrendingDown className="size-4" aria-hidden />}
          label="Lost in busy hours"
          value={formatCurrency(lost.total_lost)}
          sub="busy hours converting below average"
        />
      </div>

      {/* Heatmap */}
      <Card className="gap-4 px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Footfall heatmap
            </p>
            <h2 className="text-sm font-semibold">When your stores are busy</h2>
          </div>
          <HeatmapInfo />
        </div>
        {grid.hours.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Not enough hourly data in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="w-12" />
                  {grid.hours.map((h) => (
                    <th key={h} className="px-1 pb-1 font-medium text-muted-foreground">
                      {hourLabel(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.weekday}>
                    <th className="pr-2 text-right font-medium text-muted-foreground">
                      {WEEKDAY_LABELS[row.weekday]}
                    </th>
                    {row.cells.map((cell, i) => (
                      <td key={grid.hours[i]}>
                        {cell ? (
                          <div
                            className={`flex h-10 w-full items-center justify-center rounded-md tabular-nums ${intensityClass(
                              cell.visitors,
                              grid.maxVisitors,
                            )}`}
                            title={`${WEEKDAY_LABELS[row.weekday]} ${hourLabel(grid.hours[i])} · ${formatNumber(
                              cell.visitors,
                            )} visitors · ${formatConversion(cell.conversion_rate)} conversion`}
                          >
                            {formatNumber(cell.visitors)}
                          </div>
                        ) : (
                          <div className="h-10 w-full rounded-md bg-muted/20" aria-hidden />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Cell shade = footfall; hover for conversion. Darker = busier. Use it to staff
          the busy hours and schedule restock/breaks in the quiet ones.
        </p>
      </Card>

      {/* Lost hours */}
      {lost.hours.length > 0 && (
        <Card className="gap-3 px-4 py-4 md:px-6 md:py-5">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Lost hours
            </p>
            <h2 className="text-sm font-semibold">
              Busy hours converting below your {formatConversion(lost.avg_conversion)} average
            </h2>
            {/* The average is the benchmark every row below is measured against, so
                what was left out of it has to be visible (SPEC-113 patch). */}
            {data.excluded_cells ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(data.excluded_cells)} hours excluded from the average —
                the counter recorded more sales than visitors in them.
              </p>
            ) : null}
          </div>
          <ul className="divide-y divide-border/60">
            {lost.hours.map((h) => (
              <li key={h.hour} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <span className="font-medium">{hourLabel(h.hour)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatNumber(h.visitors)} visitors at {formatConversion(h.conversion_rate)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-warning tabular-nums">
                  ~{formatCurrency(h.est_lost_sales)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            These hours pull the most traffic but convert below your store average — the
            classic understaffed-floor signal. Estimated $ = the conversion gap × that
            hour&apos;s visitors × your average order value.
          </p>
        </Card>
      )}
    </div>
  );
}
