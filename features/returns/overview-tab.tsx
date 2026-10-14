import Link from "next/link";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Inbox,
  Percent,
  Repeat,
  RotateCcw,
  TrendingDown,
  Undo2,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/format-duration";
import { formatRate } from "@/lib/returns-format";
import type { ReturnsMetrics } from "@/types/returns";
import type { ReturnsOverview, StyleRow } from "@/types/returns-intel";
import { formatCompactCurrency, formatCurrency, formatNumber } from "@/utils/format";

import { ActionPlanCard } from "./action-plan-card";
import { KpiStat } from "./kpi-stat";
import { ReasonBar } from "./reason-bar";
import { ReturnsAttentionCard } from "./returns-attention-card";

export function OverviewTab({
  overview,
  ops,
  topStyles,
  rangeQuery,
  from,
  to,
}: {
  overview: ReturnsOverview;
  ops: ReturnsMetrics;
  topStyles: StyleRow[];
  rangeQuery: string;
  from: string;
  to: string;
}) {
  const resolution =
    ops.median_arrival_to_resolution_seconds ?? ops.avg_arrival_to_resolution_seconds;

  return (
    <div className="space-y-6">
      <ReturnsAttentionCard />
      <ActionPlanCard from={from} to={to} />
      <section
        aria-label="Returns KPIs"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <KpiStat
          label="Returns"
          value={formatNumber(overview.returns_count)}
          hint={`${formatNumber(overview.units_returned)} items`}
          icon={RotateCcw}
          tone="bg-info/15 text-info"
        />
        <KpiStat
          label="Return Rate"
          value={formatRate(overview.return_rate)}
          hint="of units sold this period"
          icon={Percent}
          tone="bg-warning/15 text-warning"
        />
        <KpiStat
          label="Return Value"
          value={formatCurrency(overview.return_value)}
          hint="gross value of returned items"
          icon={DollarSign}
          tone="bg-primary/15 text-primary"
        />
        <KpiStat
          label="Refund Amount"
          value={formatCurrency(overview.refund_total)}
          hint="cash refunded to customers"
          icon={Undo2}
          tone="bg-info/15 text-info"
        />
        <KpiStat
          label="Profit Lost"
          value={formatCurrency(overview.profit_lost)}
          hint={`≈ ${formatCompactCurrency(overview.profit_lost_annualized)}/yr projected`}
          icon={TrendingDown}
          tone="bg-destructive/15 text-destructive"
          emphasis
        />
        <KpiStat
          label="Exchange Revenue"
          value={formatCurrency(overview.exchange_total)}
          hint={`${formatCurrency(overview.credit_total)} store credit`}
          icon={Repeat}
          tone="bg-success/15 text-success"
        />
        <KpiStat
          label="Exchange Rate"
          value={formatRate(overview.exchange_pct)}
          hint="of returns kept as exchange/credit"
          icon={Repeat}
          tone="bg-ai/15 text-ai"
        />
        <KpiStat
          label="Open Backlog"
          value={formatNumber(overview.open_backlog)}
          hint="still open / in review"
          icon={Inbox}
          tone="bg-warning/15 text-warning"
        />
        <KpiStat
          label="Avg Resolution"
          value={resolution !== null ? formatDuration(resolution) : "—"}
          hint="package arrival → refund"
          icon={Clock}
          tone="bg-muted text-muted-foreground"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="font-heading text-sm tracking-wide">Why customers return</h2>
          <ReasonBar reasons={overview.reason_breakdown} />
        </Card>

        <Card className="gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm tracking-wide">Top styles by profit lost</h2>
            <Link
              href={`/returns?tab=by-style&${rangeQuery}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              All styles <ArrowRight className="size-3" />
            </Link>
          </div>
          {topStyles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No returned styles this period.</p>
          ) : (
            <ul className="divide-y divide-border">
              {topStyles.slice(0, 5).map((style) => (
                <li key={style.product_id}>
                  <Link
                    href={`/returns/style/${style.product_id}?${rangeQuery}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-foreground"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {style.style_name ?? style.style_code ?? `#${style.product_id}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {style.style_code ?? "—"} · {formatRate(style.return_rate)} rate ·{" "}
                        {formatNumber(style.units_returned)} returned
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                      {formatCurrency(style.profit_lost)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
