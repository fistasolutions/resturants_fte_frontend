"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarClock, TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  categoryBarPct,
  confidenceLabel,
  confidenceTone,
  deadlineMessage,
  deadlineState,
  deadlineTone,
  formatMoney,
  heroOccasion,
  ledgerHeadline,
  liftPhrase,
  rampSeries,
  splitCategories,
} from "@/lib/season";
import type {
  SeasonAccuracy,
  SeasonCategoryRow,
  SeasonOccasion,
  SeasonRadar,
} from "@/types/foresight";

const chartConfig = { lift: { label: "Demand vs normal" } } satisfies ChartConfig;

function Hero({ occasion, leadDays }: { occasion: SeasonOccasion; leadDays: number }) {
  const state = deadlineState(occasion, new Date());
  const series = rampSeries(occasion);
  const rampWeek = occasion.ramp
    .filter((p) => p.lift !== null && p.lift >= 1.5)
    .map((p) => p.weeks_out)
    .sort((a, b) => b - a)[0];

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" aria-hidden />
            Next occasion · {occasion.date} · in {occasion.days_until} days
          </div>
          <h2 className="mt-1 text-2xl font-semibold">{occasion.name}</h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-3">
            <span
              className={`text-4xl font-semibold tabular-nums ${
                (occasion.lift ?? 1) >= 1 ? "text-success" : "text-warning"
              }`}
            >
              {occasion.lift?.toFixed(2)}×
            </span>
            <span className="text-sm text-muted-foreground">
              {liftPhrase(occasion.lift)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {occasion.lift_range
              ? `Ranged ${occasion.lift_range[0]}×–${occasion.lift_range[1]}× across ${occasion.observations} years · `
              : ""}
            <span className={confidenceTone(occasion.confidence)}>
              {confidenceLabel(occasion.confidence)}
            </span>
          </p>
        </div>

        <div className="min-w-[240px] rounded-card border border-border p-4">
          <div className="text-xs text-muted-foreground">Reorder deadline</div>
          <div className={`mt-1 flex items-start gap-2 text-sm font-medium ${deadlineTone(state)}`}>
            {state === "passed" || state === "urgent" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : null}
            <span>{deadlineMessage(occasion, state)}</span>
          </div>
          {occasion.ramp_start_on ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Demand ramps from {occasion.ramp_start_on}; a reorder takes {leadDays} days.
            </p>
          ) : null}
        </div>
      </div>

      {series.length > 0 ? (
        <div className="mt-5">
          <div className="text-xs font-medium text-muted-foreground">
            How demand builds — weeks before {occasion.name}
          </div>
          <ChartContainer config={chartConfig} className="mt-2 h-44 w-full">
            <AreaChart data={series} accessibilityLayer margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={34}
                tickFormatter={(v) => `${v}×`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={1} stroke="var(--border)" strokeDasharray="4 4" />
              {rampWeek ? (
                <ReferenceLine
                  x={`${rampWeek}w`}
                  stroke="var(--warning)"
                  strokeDasharray="4 4"
                  label={{ value: "ramp starts", position: "insideTopLeft", fontSize: 10 }}
                />
              ) : null}
              <Area
                dataKey="lift"
                type="monotone"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.18}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      ) : null}
    </Card>
  );
}

function CategoryRow({
  row,
  rows,
}: {
  row: SeasonCategoryRow;
  rows: SeasonCategoryRow[];
}) {
  const up = row.direction === "surge";
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{row.category}</div>
        <div className="mt-1 h-[8px] overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${up ? "bg-success" : "bg-warning"}`}
            style={{ width: `${categoryBarPct(row, rows)}%` }}
          />
        </div>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${
          up ? "text-success" : "text-warning"
        }`}
      >
        {row.lift.toFixed(2)}×
      </span>
    </li>
  );
}

function CategoryOrderList({ occasion }: { occasion: SeasonOccasion }) {
  const { buy, pullBack } = splitCategories(occasion.categories);
  if (buy.length === 0 && pullBack.length === 0) return null;
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">What to order · {occasion.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The mix changes by occasion — the headline multiplier hides it. Measured
        per category over {occasion.observations} years.
      </p>

      {buy.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
            <TrendingUp className="size-3.5" aria-hidden />
            Buy deeper
          </div>
          <ul className="mt-2 flex flex-col gap-2.5">
            {buy.map((row) => (
              <CategoryRow key={row.category} row={row} rows={occasion.categories} />
            ))}
          </ul>
        </div>
      ) : null}

      {pullBack.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <TrendingDown className="size-3.5" aria-hidden />
            Pull back
          </div>
          <ul className="mt-2 flex flex-col gap-2.5">
            {pullBack.map((row) => (
              <CategoryRow key={row.category} row={row} rows={occasion.categories} />
            ))}
          </ul>
          <p className="mt-2.5 text-xs text-muted-foreground">
            These sell <em>worse</em> than a normal week around {occasion.name}.
            Buying them off the headline multiplier is the expensive mistake.
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function StoreBars({ occasion }: { occasion: SeasonOccasion }) {
  if (occasion.stores.length === 0) return null;
  const max = Math.max(...occasion.stores.map((s) => s.expected_daily), 1);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">
        Expected daily revenue · {occasion.name}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Solid is the forecast; the lighter track behind it is today&apos;s baseline.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {occasion.stores.map((store) => (
          <li key={store.location_id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{store.location_name ?? "Unattributed"}</span>
              <span className="tabular-nums">
                {formatMoney(store.expected_daily)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {store.lift}× · from {formatMoney(store.baseline_daily)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-[10px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/25"
                style={{ width: `${(store.expected_daily / max) * 100}%` }}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      store.expected_daily > 0
                        ? (store.baseline_daily / store.expected_daily) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Timeline({ radar }: { radar: SeasonRadar }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">
        Next {radar.horizon_weeks} weeks
      </h3>
      <ul className="mt-3 flex flex-col">
        {radar.occasions.map((occasion) => {
          const state = deadlineState(occasion, new Date());
          const thin = occasion.status === "insufficient_history";
          const quiet = occasion.status === "suppressed";
          return (
            <li
              key={`${occasion.name}-${occasion.date}`}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border py-3 last:border-0 sm:grid-cols-[1fr_140px_180px]"
            >
              <div>
                <div className="text-sm font-medium">{occasion.name}</div>
                <div className="text-xs text-muted-foreground">
                  {occasion.date} · in {occasion.days_until} days
                </div>
              </div>
              <div className="text-sm sm:text-right">
                {thin ? (
                  <span className="text-xs text-muted-foreground">
                    Not enough history
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 font-semibold tabular-nums ${
                      quiet ? "text-warning" : "text-success"
                    }`}
                  >
                    {quiet ? (
                      <TrendingDown className="size-3.5" aria-hidden />
                    ) : (
                      <TrendingUp className="size-3.5" aria-hidden />
                    )}
                    {occasion.lift?.toFixed(2)}×
                  </span>
                )}
              </div>
              <div className={`text-xs sm:text-right ${deadlineTone(state)}`}>
                {thin ? "—" : state === "passed"
                  ? "Order-by passed"
                  : occasion.order_by_on
                    ? `Order by ${occasion.order_by_on}`
                    : "No ramp forecast"}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Ledger({ accuracy }: { accuracy: SeasonAccuracy }) {
  const head = ledgerHeadline(accuracy);
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Forecast track record</h3>
      {head.scored ? (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{head.hitRate}</div>
            <div className="text-xs text-muted-foreground">Within tolerance</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{head.judged}</div>
            <div className="text-xs text-muted-foreground">Judged</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{head.meanError}</div>
            <div className="text-xs text-muted-foreground">Mean error</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{head.pending}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{head.waitingFor}</p>
      )}
      {accuracy.forecasts.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Occasion</th>
                <th className="py-2 font-medium">Store</th>
                <th className="py-2 text-right font-medium">Predicted</th>
                <th className="py-2 text-right font-medium">Actual</th>
                <th className="py-2 text-right font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {accuracy.forecasts.slice(0, 20).map((row, index) => (
                <tr key={`${row.occasion_name}-${row.occasion_date}-${index}`}
                    className="border-b border-border last:border-0">
                  <td className="py-2">{row.occasion_name}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.location_name ?? "All stores"}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {row.predicted_lift.toFixed(2)}×
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {row.actual_lift === null ? "—" : `${row.actual_lift.toFixed(2)}×`}
                  </td>
                  <td
                    className={`py-2 text-right font-medium ${
                      row.verdict === "hit" ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {row.verdict ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}

export function SeasonView({
  radar,
  accuracy,
}: {
  radar: SeasonRadar;
  accuracy: SeasonAccuracy;
}) {
  const hero = heroOccasion(radar.occasions);
  return (
    <div className="flex flex-col gap-4">
      {hero ? (
        <>
          <Hero occasion={hero} leadDays={radar.lead_days} />
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryOrderList occasion={hero} />
            <StoreBars occasion={hero} />
          </div>
          <Ledger accuracy={accuracy} />
        </>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          Not enough trading history yet to forecast an upcoming occasion.
        </Card>
      )}
      <Timeline radar={radar} />
    </div>
  );
}
