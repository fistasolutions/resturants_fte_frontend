"use client";

import { Card } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";
import { cn } from "@/lib/utils";
import type { LaunchDrop, LaunchWatchData } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by style or category; facet on the verdict (SPEC-258). */
const CONTROLS: TableSpec<LaunchDrop> = {
  search: (drop) => [drop.title, drop.category],
  facet: (drop) => drop.verdict,
};
const COLUMNS = 8;

function verdictTone(drop: LaunchDrop): string {
  if (drop.verdictTone === "good") return "bg-success/10 text-success";
  if (drop.verdictTone === "warn") return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
}

/** A drop at winner pace running out of stock is the reorder to place today. */
function isUrgent(drop: LaunchDrop): boolean {
  return (
    (drop.verdict === "Ahead of winners" || drop.verdict === "Winner pace") &&
    drop.daysOfCover !== null &&
    drop.daysOfCover < 42
  );
}

/**
 * Foresight → Launch Watch (SPEC-192). How each new style is selling against what
 * a style that turned out to be a winner had sold by the same age.
 *
 * The reorder lead time is six weeks, so a winner spotted at day 60 is a winner
 * missed. Every figure is observed — nothing projects where a drop will finish.
 */
export function LaunchWatchView({ data }: { data: LaunchWatchData }) {
  const { summary, benchmark, drops } = data;

  if (drops.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          No styles first sold in the last {summary.watchDays} days
        </p>
      </Card>
    );
  }

  return (
    // Bottom clearance keeps the pager clear of the Ask Glisp pill.
    <div className="flex flex-col gap-4 pb-16">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            New drops watched
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.dropsWatched)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            first sold in {summary.watchDays} days
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            At or above winner pace
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-success">
            {formatNumber(summary.atOrAboveWinnerPace)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Reorder now
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-destructive">
            {formatNumber(summary.urgentReorders)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            winner pace, under 6 weeks cover
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            A winner had sold
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
            {benchmark.d7 ?? "—"} · {benchmark.d14 ?? "—"} · {benchmark.d30 ?? "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">by day 7 · 14 · 30</p>
        </Card>
      </div>

      {summary.urgentReorders > 0 && (
        <Card className="border-l-4 border-l-destructive p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">
              {formatNumber(summary.urgentReorders)} styles are selling at winner pace with
              under six weeks of stock.
            </span>{" "}
            The reorder lead time is six weeks — these are the ones to place today.
          </p>
        </Card>
      )}

      <LaunchWatchTable drops={drops} />

      <p className="text-xs text-muted-foreground">
        A style&apos;s age runs from its <span className="font-medium">first sale</span>, not
        its Shopify creation date — a product can be created weeks before it goes on sale.
        Each drop is scored at the largest milestone it has actually lived through, so a
        nine-day-old style is never judged against a day-30 benchmark. {benchmark.basis}.
        Nothing here forecasts where a drop will finish.
      </p>
    </div>
  );
}

/** The table with its own search, verdict chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — nothing above it moves. */
function LaunchWatchTable({ drops }: { drops: LaunchDrop[] }) {
  const t = useTableControls(drops, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="styles"
        facetLabel="Verdict"
        query={t.query}
        onQuery={t.setQuery}
        facets={t.facets}
        facet={t.facet}
        onFacet={t.setFacet}
        matches={t.matches}
        total={t.total}
        active={t.active}
        onClear={t.clear}
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={HEAD_LEFT}>Style</th>
              <th className={HEAD}>Age</th>
              <th className={HEAD}>Sold by then</th>
              <th className={HEAD}>A winner had</th>
              <th className={HEAD}>Pace</th>
              <th className={HEAD}>In stock</th>
              <th className={HEAD}>Cover</th>
              <th className={HEAD_LEFT}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="styles" onClear={t.clear} /> : null}
            {t.rows.map((drop) => (
              <tr
                key={drop.productId}
                className={cn(
                  "border-b border-border last:border-0 hover:bg-accent/40",
                  isUrgent(drop) && "bg-destructive/5",
                )}
              >
                <td className="px-3 py-2.5 text-left text-sm">
                  <span className="font-medium text-foreground">{drop.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {drop.category} · {formatCurrency(drop.revenueTotal)} so far
                  </span>
                </td>
                <td className={`${CELL} text-muted-foreground`}>{drop.ageDays}d</td>
                <td className={`${CELL} text-foreground`}>
                  {drop.unitsAtMilestone === null
                    ? "—"
                    : `${formatNumber(drop.unitsAtMilestone)}`}
                  {drop.milestoneDays !== null && (
                    <span className="block text-[11px] text-muted-foreground">
                      by day {drop.milestoneDays}
                    </span>
                  )}
                </td>
                <td className={`${CELL} text-muted-foreground`}>
                  {drop.benchmarkUnits === null ? "—" : formatNumber(drop.benchmarkUnits)}
                </td>
                <td
                  className={cn(
                    CELL,
                    "font-semibold",
                    (drop.paceRatio ?? 0) >= 1 ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {drop.paceRatio === null ? "—" : `${drop.paceRatio}×`}
                </td>
                <td className={`${CELL} text-foreground`}>{formatNumber(drop.onHand)}</td>
                <td
                  className={cn(
                    CELL,
                    drop.daysOfCover !== null && drop.daysOfCover < 42
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {drop.daysOfCover === null ? "—" : `${drop.daysOfCover}d`}
                </td>
                <td className="px-3 py-2.5 text-left">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                      verdictTone(drop),
                    )}
                  >
                    {drop.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="styles" onPage={t.setPage} />
</Card>
  );
}
