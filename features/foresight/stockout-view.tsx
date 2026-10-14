"use client";

import { Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  bandBarClass,
  bandTextClass,
  coverBarPct,
  donutSlices,
  formatDays,
  formatMoney,
  fulfilmentSummary,
  itemLabel,
  verdictLabel,
  verdictTone,
  BAND_LABEL,
} from "@/lib/stockout";
import type { StockoutAccuracy, StockoutBoard } from "@/types/foresight";

const chartConfig = { value: { label: "Variants" } } satisfies ChartConfig;

function RiskDonut({ board }: { board: StockoutBoard }) {
  const slices = donutSlices(board.counts);
  const total = slices.reduce((n, s) => n + s.count, 0);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Risk right now</h3>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing tracked yet in this window.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-5">
          <ChartContainer config={chartConfig} className="aspect-square h-32 shrink-0">
            <PieChart accessibilityLayer>
              <Pie
                data={slices}
                dataKey="count"
                nameKey="label"
                innerRadius={34}
                outerRadius={58}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.band} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="flex flex-col gap-1.5 text-sm">
            {slices.map((slice) => (
              <li key={slice.band} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <span className="font-semibold tabular-nums">{slice.count}</span>
                <span className="text-muted-foreground">{slice.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function RevenueAtRisk({ board }: { board: StockoutBoard }) {
  const atRisk = board.counts.critical + board.counts.warning;
  return (
    <Card className="flex flex-col justify-between p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <TrendingDown className="size-4 text-destructive" aria-hidden />
        Revenue at risk
      </div>
      <div className="mt-3">
        <div className="text-3xl font-semibold tabular-nums">
          {formatMoney(board.revenue_at_risk_total)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Across {atRisk} variant{atRisk === 1 ? "" : "s"} that run out within{" "}
          {board.lead_days} days — the time a reorder takes.
        </p>
      </div>
    </Card>
  );
}

function FulfilmentGauge({ accuracy }: { accuracy: StockoutAccuracy }) {
  const summary = fulfilmentSummary(accuracy);
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4 text-primary" aria-hidden />
        Prediction fulfilment
      </div>
      {summary.scored ? (
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <ChartContainer config={chartConfig} className="aspect-square h-32 shrink-0">
            <RadialBarChart
              data={[{ name: "hit", value: summary.hitRatePct }]}
              startAngle={90}
              endAngle={-270}
              innerRadius={44}
              outerRadius={62}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                fill="var(--primary)"
                background
                isAnimationActive={false}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-xl font-semibold"
              >
                {summary.hitRateLabel}
              </text>
            </RadialBarChart>
          </ChartContainer>
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Judged</dt>
              <dd className="font-semibold tabular-nums">{summary.judged}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Mean error</dt>
              <dd className="font-semibold tabular-nums">{summary.meanError}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Acted on</dt>
              <dd className="font-semibold tabular-nums text-primary">
                {summary.actedUpon}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{summary.waitingFor}</p>
      )}
      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Acted on</span> means you
        reordered after the warning, so the run-out never happened. Those are kept
        out of the hit rate — counting them either way would misreport it.
      </p>
    </Card>
  );
}

function RiskTable({ board }: { board: StockoutBoard }) {
  const rows = board.items.filter((i) => i.band !== "healthy").slice(0, 40);
  if (rows.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Nothing is forecast to run out inside the {board.lead_days}-day reorder
        window. That is the good outcome.
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Running out first</h3>
      <ul className="mt-3 flex flex-col">
        {rows.map((row) => (
          <li
            key={`${row.variant_id}-${row.location_id}`}
            className="grid grid-cols-[1fr_auto] items-start gap-3 border-b border-border py-3 last:border-0 sm:grid-cols-[1fr_180px_120px]"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{itemLabel(row)}</div>
              <div className="mt-1.5 h-[9px] overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${bandBarClass(row.band)}`}
                  style={{ width: `${coverBarPct(row.days_of_cover, board.lead_days)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {row.on_hand} on hand · {row.daily_units.toFixed(1)}/day
              </div>
            </div>
            <div className="text-sm sm:text-right">
              <div className={`font-semibold ${bandTextClass(row.band)}`}>
                {formatDays(row.days_of_cover)} left
              </div>
              <div className="text-xs text-muted-foreground">
                out {row.predicted_out_on} · {BAND_LABEL[row.band]}
              </div>
            </div>
            <div className="text-sm font-semibold tabular-nums sm:text-right">
              {formatMoney(row.revenue_at_risk)}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Ledger({ accuracy }: { accuracy: StockoutAccuracy }) {
  if (accuracy.predictions.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Past calls</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Predicted</th>
              <th className="py-2 font-medium">Actual</th>
              <th className="py-2 text-right font-medium">Error</th>
              <th className="py-2 text-right font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {accuracy.predictions.slice(0, 25).map((row, index) => (
              <tr key={`${row.product_title}-${row.predicted_out_on}-${index}`}
                  className="border-b border-border last:border-0">
                <td className="max-w-[260px] truncate py-2">
                  {[row.product_title, row.variant_title, row.location_name]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="py-2 tabular-nums">{row.predicted_out_on}</td>
                <td className="py-2 tabular-nums">{row.actual_out_on ?? "—"}</td>
                <td className="py-2 text-right tabular-nums">
                  {row.abs_error_days === null ? "—" : `${row.abs_error_days}d`}
                </td>
                <td className={`py-2 text-right font-medium ${verdictTone(row.verdict)}`}>
                  {verdictLabel(row.verdict)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function StockoutView({
  board,
  accuracy,
}: {
  board: StockoutBoard;
  accuracy: StockoutAccuracy;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <RiskDonut board={board} />
        <RevenueAtRisk board={board} />
        <FulfilmentGauge accuracy={accuracy} />
      </div>

      <p className="text-sm text-muted-foreground">
        <AlertTriangle className="mr-1 inline size-3.5 text-warning" aria-hidden />
        Which variants run out, where, and when — from {board.window_days} days of
        sales against live stock at each location. Every figure is computed in the
        backend; the AI only decides what is worth showing you.
      </p>

      <RiskTable board={board} />
      <Ledger accuracy={accuracy} />
    </div>
  );
}
