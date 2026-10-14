import Link from "next/link";

import { Card } from "@/components/ui/card";
import { marginCell, sellThroughCell, summaryTiles, verdictBadgeClass } from "@/lib/brand-verdicts";
import { cn } from "@/lib/utils";
import type { BrandRow, BrandVerdictsData } from "@/types/analysis";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface Props {
  data: BrandVerdictsData;
}

const HEAD =
  "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums";

const TILE_TONE: Record<string, string> = {
  plain: "text-foreground",
  bad: "text-destructive",
  warn: "text-warning",
  good: "text-success",
  neutral: "text-foreground",
  muted: "text-muted-foreground",
};

function VerdictBadge({ row }: { row: BrandRow }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
        verdictBadgeClass(row.verdictTone),
      )}
    >
      {row.verdictLabel}
    </span>
  );
}

/**
 * Products → Brands (SPEC-239). One row per vendor: what it sold, what came back
 * across every channel, how much is sitting, what it earned after cost — and the
 * verdict the backend drew from those (SPEC-246), with the sentence that names the
 * number that tripped it. Nothing here is calculated (root Rule 8).
 */
export function BrandVerdictsView({ data }: Props) {
  const { summary, brands } = data;

  if (brands.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          No brand sold anything in this period
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Widen the date range.</p>
      </Card>
    );
  }

  const tiles = summaryTiles(summary);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Brand verdict summary" className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Card key={tile.key} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums", TILE_TONE[tile.tone])}>
              {tile.value}
            </p>
          </Card>
        ))}
      </section>

      <p className="text-xs text-muted-foreground">
        Returns count every channel — Shopify refunds, the counter included. Margin judges
        a brand only when at least {formatPercent(summary.marginMinCoveragePct)} of its
        sales carry a cost. Reasons for the returns are on{" "}
        <Link
          href="/products/returns"
          className="rounded text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Return Leak
        </Link>
        .
      </p>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(HEAD, "text-left")}>Brand</th>
                <th className={cn(HEAD, "text-left")}>Verdict</th>
                <th className={HEAD}>Units</th>
                <th className={HEAD}>Revenue</th>
                <th className={HEAD}>Returns</th>
                <th className={HEAD}>Sell-through</th>
                <th className={HEAD}>Dead stock</th>
                <th className={HEAD}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((row) => {
                const margin = marginCell(row);
                const quiet = row.verdict === "too_few_sales";
                return (
                  <tr
                    key={row.vendor}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-accent/40",
                      quiet && "opacity-70",
                    )}
                  >
                    <td className="px-3 py-2.5 text-left text-sm">
                      <span className="font-medium text-foreground">{row.vendor}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatNumber(row.products)} products · {formatNumber(row.orders)} orders
                      </span>
                    </td>
                    <td className="max-w-md px-3 py-2.5 text-left text-sm">
                      <VerdictBadge row={row} />
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        {row.why}
                      </span>
                    </td>
                    <td className={`${CELL} text-muted-foreground`}>
                      {formatNumber(row.units)}
                      {row.unitsReturned > 0 && (
                        <span className="block text-[11px] text-destructive">
                          −{formatNumber(row.unitsReturned)} back
                        </span>
                      )}
                    </td>
                    <td className={`${CELL} text-foreground`}>{formatCurrency(row.revenue)}</td>
                    <td
                      className={cn(
                        CELL,
                        row.returnRate >= 0.25
                          ? "text-destructive"
                          : row.returnRate >= 0.15
                            ? "text-warning"
                            : "text-muted-foreground",
                      )}
                    >
                      {formatPercent(row.returnRate * 100)}
                      {row.refundValue > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          {formatCurrency(row.refundValue)}
                        </span>
                      )}
                    </td>
                    <td className={`${CELL} text-muted-foreground`}>
                      {sellThroughCell(row)}
                      <span className="block text-[11px] text-muted-foreground">
                        {formatNumber(row.stockUnits)} on hand
                      </span>
                    </td>
                    <td
                      className={cn(
                        CELL,
                        row.deadStockValue > 0 ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {row.deadStockValue > 0 ? formatCurrency(row.deadStockValue) : "—"}
                      {row.deadProducts > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          {formatNumber(row.deadProducts)} products
                        </span>
                      )}
                    </td>
                    <td
                      className={cn(
                        CELL,
                        margin.muted
                          ? "text-muted-foreground"
                          : row.marginPct !== null && row.marginPct < 0
                            ? "text-destructive"
                            : "text-foreground",
                      )}
                    >
                      {margin.text}
                      {margin.sub && (
                        <span className="block text-[11px] text-muted-foreground">{margin.sub}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
