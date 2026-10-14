import Link from "next/link";
import { Send, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { StoreDailyChart } from "@/features/traffic/store-daily-chart";
import { TrafficEmpty } from "@/features/traffic/traffic-empty";
import { formatConversion, hourLabel } from "@/lib/conversion";
import { WEEKDAY_LABELS, buildHeatmap, intensityClass } from "@/lib/traffic-heatmap";
import type { TrafficStoreDetail } from "@/types/traffic";
import { formatCurrency, formatNumber } from "@/utils/format";

function TrendChip({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  if (Math.abs(delta) < 0.005) {
    return <span className="text-xs text-muted-foreground">flat vs last period</span>;
  }
  const up = delta > 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
      {up ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(1)} pts vs last period
    </span>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <Card className="relative gap-1 px-4 py-3">
      <p className="pr-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <ExplainButton target={{ metric: label, value, detail: typeof sub === "string" ? sub : null }} />
      <p className="text-lg font-semibold leading-tight">{value}</p>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </Card>
  );
}

export function StoreDetailView({ data }: { data: TrafficStoreDetail }) {
  if (!data.has_data) return <TrafficEmpty connected={Boolean(data.last_sync)} />;

  const t = data.totals;
  const b = data.benchmark;
  const grid = buildHeatmap(data.heatmap);
  const lost = data.lost_hours;
  const showProfit = t.profit_per_visitor != null;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${showProfit ? "xl:grid-cols-5" : ""}`}>
        <Kpi label="Visitors" value={formatNumber(t.visitors)} sub={`${formatNumber(t.visitors_out)} walk-outs`} />
        <Kpi label="Customers" value={formatNumber(t.transactions)} sub={`${formatNumber(t.units)} units`} />
        <Kpi
          label="Conversion"
          value={data.counter_suspect ? "—" : formatConversion(t.conversion_rate)}
          sub={data.counter_suspect ? "sensor under-count" : <TrendChip delta={data.trend.conversion_delta} />}
        />
        <Kpi
          label="Per visitor"
          value={t.sales_per_visitor != null ? formatCurrency(t.sales_per_visitor) : "—"}
          sub={
            <span title={`Gross ${formatCurrency(t.gross_sales ?? t.sales)} − Tax ${formatCurrency(t.tax_collected ?? 0)} = Net ${formatCurrency(t.sales)}`}>
              {formatCurrency(t.sales)} net sales
              {t.tax_collected ? ` · ${formatCurrency(t.tax_collected)} tax` : " · no tax"}
            </span>
          }
        />
        {showProfit && (
          <Kpi
            label="Profit / visitor"
            value={formatCurrency(t.profit_per_visitor as number)}
            sub={`${formatCurrency(t.gross_profit as number)} profit${
              t.profit_margin != null ? ` · ${Math.round(t.profit_margin * 100)}% margin` : ""
            }`}
          />
        )}
      </div>

      {/* Opportunity vs the leader + nudge */}
      {b.gap_pts != null && b.opportunity != null ? (
        <Card className="gap-3 border border-warning/30 bg-warning/5 px-4 py-4 md:flex md:items-center md:justify-between md:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-warning">
              <TrendingDown className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {Math.round(b.gap_pts * 100)} pts behind {b.store}
              </p>
              <p className="text-sm text-muted-foreground">
                Converting {formatConversion(t.conversion_rate)} vs {b.store}&apos;s{" "}
                {formatConversion(b.rate)} — about{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(b.opportunity)}
                </span>{" "}
                left on the table this period
                {b.uplift_transactions != null
                  ? ` (~+${formatNumber(b.uplift_transactions)} sales to match ${b.store})`
                  : ""}
                .
              </p>
            </div>
          </div>
          <Button size="sm" className="mt-3 shrink-0 md:mt-0" asChild>
            <Link href={`/brief/traffic/send/${data.location_id}`}>
              <Send className="size-4" aria-hidden />
              Send staffing nudge
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="gap-1 border border-success/30 bg-success/5 px-4 py-3">
          <p className="text-sm font-semibold text-success">Converting in line with your best store</p>
          <p className="text-xs text-muted-foreground">No meaningful gap to close right now.</p>
        </Card>
      )}

      {/* Daily footfall + conversion */}
      {data.daily.length > 0 && (
        <Card className="gap-4 px-4 py-4 md:px-6 md:py-5">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Over time
            </p>
            <h2 className="text-sm font-semibold">Daily footfall &amp; conversion</h2>
          </div>
          <StoreDailyChart daily={data.daily} />
        </Card>
      )}

      {/* Peak-hours heatmap */}
      {grid.hours.length > 0 && (
        <Card className="gap-4 px-4 py-4 md:px-6 md:py-5">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              When it&apos;s busy
            </p>
            <h2 className="text-sm font-semibold">{data.location}&apos;s footfall by day &amp; hour</h2>
          </div>
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
                            title={`${WEEKDAY_LABELS[row.weekday]} ${hourLabel(grid.hours[i])} · ${formatNumber(cell.visitors)} visitors · ${formatConversion(cell.conversion_rate)}`}
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
        </Card>
      )}

      {/* Lost hours */}
      {lost.hours.length > 0 && (
        <Card className="gap-3 px-4 py-4 md:px-6 md:py-5">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Lost hours
            </p>
            <h2 className="text-sm font-semibold">
              Busy hours converting below this store&apos;s {formatConversion(lost.avg_conversion)} average
            </h2>
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
            These hours pull the most traffic but convert below this store&apos;s own average —
            the classic understaffed-floor signal.
          </p>
        </Card>
      )}

      {/* Lost $ by day of week */}
      {data.lost_by_weekday.length > 0 && (
        <Card className="gap-3 px-4 py-4 md:px-6 md:py-5">
          <div>
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Where it leaks by day
            </p>
            <h2 className="text-sm font-semibold">Days converting below this store&apos;s average</h2>
          </div>
          <ul className="divide-y divide-border/60">
            {data.lost_by_weekday.map((d) => (
              <li key={d.weekday} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <span className="font-medium">{WEEKDAY_LABELS[d.weekday]}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatNumber(d.visitors)} visitors at {formatConversion(d.conversion_rate)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-warning tabular-nums">
                  ~{formatCurrency(d.est_lost_sales)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
