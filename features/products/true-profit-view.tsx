"use client";

import { Card } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";
import type { TrueProfitData, TrueProfitRow } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: TrueProfitData;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by product or category; facet on the verdict (SPEC-258). */
const CONTROLS: TableSpec<TrueProfitRow> = {
  search: (row) => [row.title, row.category],
  facet: (row) => row.verdict,
};
const COLUMNS = 9;

function VerdictBadge({ row }: { row: TrueProfitRow }) {
  const tone =
    row.verdictTone === "bad"
      ? "bg-destructive/10 text-destructive"
      : row.verdictTone === "good"
        ? "bg-success/10 text-success"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-block rounded-md whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {row.verdict}
    </span>
  );
}

/**
 * Products → True Profit (SPEC-185). What each product actually earned once the
 * cost of the goods, the discount that moved it and the refunds that came back
 * are taken off. Every figure arrives computed from the backend (root Rule 8).
 */
export function TrueProfitView({ data }: Props) {
  const { summary, products } = data;

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">No products sold in this period</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Widen the date range to see product economics.
        </p>
      </Card>
    );
  }

  const tiles = [
    { label: "Gross revenue", value: formatCurrency(summary.grossRevenue), tone: "" },
    {
      label: "Discounts",
      value: `−${formatCurrency(summary.discounts)}`,
      tone: "text-destructive",
    },
    { label: "Cost of goods", value: `−${formatCurrency(summary.cogs)}`, tone: "text-destructive" },
    { label: "Returns", value: `−${formatCurrency(summary.returns)}`, tone: "text-destructive" },
    {
      label: "True profit",
      value: formatCurrency(summary.trueProfit),
      tone: summary.trueProfit < 0 ? "text-destructive" : "text-success",
    },
  ];

  return (
    // Bottom clearance keeps the pager clear of the Ask Glisp pill.
    <div className="flex flex-col gap-4 pb-16">
      <section
        aria-label="True profit summary"
        className="grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${tile.tone || "text-foreground"}`}>
              {tile.value}
            </p>
          </Card>
        ))}
      </section>

      {summary.lossMakers > 0 && (
        <Card className="border-l-4 border-l-destructive p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">
              {formatNumber(summary.lossMakers)} products are losing money
            </span>{" "}
            — {formatCurrency(Math.abs(summary.lossMakerTotal))} in this period. They rank as
            winners on every revenue-sorted view in the app.
          </p>
          {summary.missingCostProducts > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatNumber(summary.missingCostProducts)} more products have no cost data and
              are excluded from the verdict rather than counted as profitable.
            </p>
          )}
        </Card>
      )}

      <TrueProfitTable products={products} />
    </div>
  );
}

/** The table with its own search, verdict chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — the tiles above never move. */
function TrueProfitTable({ products }: { products: TrueProfitRow[] }) {
  const t = useTableControls(products, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="products"
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
              <th className={HEAD_LEFT}>Product</th>
              <th className={HEAD}>Units</th>
              <th className={HEAD}>Gross revenue</th>
              <th className={HEAD}>Discounts</th>
              <th className={HEAD}>COGS</th>
              <th className={HEAD}>Returns</th>
              <th className={HEAD}>True profit</th>
              <th className={HEAD}>Margin</th>
              <th className={HEAD_LEFT}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="products" onClear={t.clear} /> : null}
            {t.rows.map((row) => {
              const noCost = row.costCoveragePct === 0;
              return (
                <tr
                  key={row.productId}
                  className={`border-b border-border last:border-0 hover:bg-accent/40 ${
                    noCost ? "opacity-70" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-left text-sm">
                    <span className="font-medium text-foreground">{row.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {row.category}
                    </span>
                  </td>
                  <td className={`${CELL} text-muted-foreground`}>
                    {formatNumber(row.units)}
                    {row.unitsReturned > 0 && (
                      <span className="block text-[11px] text-destructive">
                        −{formatNumber(row.unitsReturned)} returned
                      </span>
                    )}
                  </td>
                  <td className={`${CELL} text-foreground`}>
                    {formatCurrency(row.grossRevenue)}
                  </td>
                  <td className={`${CELL} text-destructive`}>
                    {row.discounts > 0 ? `−${formatCurrency(row.discounts)}` : "—"}
                  </td>
                  <td className={`${CELL} text-destructive`}>
                    {row.cogs > 0 ? `−${formatCurrency(row.cogs)}` : "—"}
                  </td>
                  <td className={`${CELL} text-destructive`}>
                    {row.returns > 0 ? `−${formatCurrency(row.returns)}` : "—"}
                  </td>
                  <td
                    className={`${CELL} font-semibold ${
                      row.trueProfit < 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(row.trueProfit)}
                  </td>
                  <td className={`${CELL} text-muted-foreground`}>
                    {noCost || row.marginPct === null ? "—" : `${row.marginPct}%`}
                  </td>
                  <td className="px-3 py-2.5 text-left">
                    <VerdictBadge row={row} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="products" onPage={t.setPage} />
    </Card>
  );
}
