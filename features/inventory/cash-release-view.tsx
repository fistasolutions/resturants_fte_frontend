"use client";

import { AlertTriangle, CalendarDays, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { PlanFilterBar } from "@/features/shared/plan-filter-bar";
import {
  EMPTY_CASH_FILTERS,
  filterCashRelease,
  type CashReleaseFilters,
} from "@/lib/planning-filters";
import { depthLabel, formatShortDate } from "@/lib/planning-format";
import type { CashReleasePlan } from "@/types/planning";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: CashReleasePlan | null;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/**
 * Cash Release (SPEC-218, backend SPEC-227). Dead Stock says what is stuck; this
 * says what to do about it, in what order, and when the cash comes back.
 *
 * The estimate caveat sits directly under the tiles and is never collapsed or
 * moved into a footnote: this number could end up in a cash plan, so it has to
 * carry its own limits where the reader cannot miss it.
 */
export function CashReleaseView({ data }: Props) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not build the cash-release plan. Try again shortly.
        </p>
      </Card>
    );
  }

  return <CashReleaseBody plan={data} />;
}

function CashReleaseBody({ plan }: { plan: CashReleasePlan }) {
  const [filters, setFilters] = useState<CashReleaseFilters>(EMPTY_CASH_FILTERS);
  // Totals are recomputed from what survived the filter, never carried over from
  // the server — a summary card that disagrees with the rows under it is worse
  // than no card at all.
  const { weeks, totals } = useMemo(
    () => filterCashRelease(plan, filters),
    [plan, filters],
  );
  const data = plan;
  const active =
    filters.query !== "" || filters.bucket !== "all" || filters.week !== "all";

  if (plan.weeks.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
        <p className="text-sm font-medium text-foreground">No dead stock to release</p>
        <p className="text-sm text-muted-foreground">
          Nothing in the catalogue has been sitting unsold for 90 days or more.
        </p>
      </Card>
    );
  }

  const tiles = [
    { label: "Products in plan", value: formatNumber(totals.products) },
    { label: "Stock value", value: formatCurrency(totals.stock_value) },
    { label: "Expected cash", value: formatCurrency(totals.expected_cash) },
    { label: "Margin given up", value: formatCurrency(totals.margin_given_up) },
  ];

  const weekOptions = [
    { value: "all", label: "All weeks" },
    ...plan.weeks.map((w) => ({
      value: String(w.week),
      label: `Week ${w.week} · ${formatShortDate(w.starts_on)}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PlanFilterBar
        query={filters.query}
        onQueryChange={(query) => setFilters((f) => ({ ...f, query }))}
        searchPlaceholder="Search product…"
        selects={[
          {
            id: "cash-week",
            label: "Week",
            value: filters.week,
            options: weekOptions,
            onChange: (week) => setFilters((f) => ({ ...f, week })),
          },
          {
            id: "cash-bucket",
            label: "Age",
            value: filters.bucket,
            options: [
              { value: "all", label: "All ages" },
              { value: "180+d", label: "180+ days" },
              { value: "90-180d", label: "90–180 days" },
            ],
            onChange: (bucket) => setFilters((f) => ({ ...f, bucket })),
          },
        ]}
        summary={`${formatNumber(totals.products)} of ${formatNumber(
          plan.totals.products,
        )} products`}
        active={active}
        onReset={() => setFilters(EMPTY_CASH_FILTERS)}
      />

      <section aria-label="Plan summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {tile.value}
            </p>
          </Card>
        ))}
      </section>

      <Card className="border-border/70 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">{data.basis}</p>
      </Card>

      {/* The plan is capped at the largest holdings, so on a real catalogue it
          covers a subset. Saying so is the difference between a plan and a
          number that quietly reads as the whole position. */}
      {data.coverage && !data.coverage.complete ? (
        <Card className="flex gap-3 border-amber-500/40 bg-amber-500/5 p-4">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              This plan covers the largest holdings, not all dead stock
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatNumber(data.coverage.products_planned)} of{" "}
              {formatNumber(data.coverage.products_total)} dead products are
              scheduled — {formatCurrency(data.coverage.value_planned)} of{" "}
              {formatCurrency(data.coverage.value_total)} ({data.coverage.value_pct}%
              of the value), because the biggest holdings are placed first.
            </p>
          </div>
        </Card>
      ) : null}

      {weeks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">No products match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing in the plan matches these filters. Clear them to see all{" "}
            {formatNumber(plan.totals.products)}.
          </p>
        </Card>
      ) : null}

      {weeks.map((week) => (
        <Card key={week.week} className="overflow-hidden">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
              <h3 className="text-sm font-semibold text-foreground">
                Week {week.week}
              </h3>
              <span className="text-sm text-muted-foreground">
                from {formatShortDate(week.starts_on)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span className="text-muted-foreground">
                {formatNumber(week.products)} products
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(week.expected_cash)}
              </span>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className={HEAD_LEFT} scope="col">Product</th>
                  <th className={HEAD} scope="col">Unsold</th>
                  <th className={HEAD} scope="col">Units</th>
                  <th className={HEAD} scope="col">Stock value</th>
                  <th className={HEAD} scope="col">Depth</th>
                  <th className={HEAD} scope="col">Expected cash</th>
                </tr>
              </thead>
              <tbody>
                {week.items.map((item) => (
                  <tr key={item.product_id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 text-left text-sm text-foreground">
                      {item.title}
                    </td>
                    <td className={`${CELL} text-muted-foreground`}>
                      {item.days_since_last_sale === null
                        ? "never sold"
                        : `${formatNumber(item.days_since_last_sale)}d`}
                    </td>
                    <td className={CELL}>{formatNumber(item.stock)}</td>
                    <td className={CELL}>{formatCurrency(item.stock_value)}</td>
                    <td className={CELL}>
                      <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {depthLabel(item.discount_pct)}
                      </span>
                    </td>
                    <td className={`${CELL} font-medium text-foreground`}>
                      {formatCurrency(item.expected_cash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
