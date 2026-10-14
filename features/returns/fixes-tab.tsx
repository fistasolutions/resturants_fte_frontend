"use client";

import { Card } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";
import { cn } from "@/lib/utils";
import type { ReturnFixesData, ReturnFixProduct } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: ReturnFixesData;
}

const NO_FIX_PREFIX = "No page fix";
const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by product or top reason; facet on the fix (SPEC-258). */
const CONTROLS: TableSpec<ReturnFixProduct> = {
  search: (product) => [product.title, product.topReason],
  facet: (product) => product.fix,
};
const COLUMNS = 6;

/** Sizing reasons get the warning tint, matching `reason-bar.tsx`. */
function isSizing(fix: string): boolean {
  return fix.startsWith("Size chart");
}

/**
 * Returns → Product Fixes (SPEC-187). Turns each product's dominant return reason
 * into the page change it implies.
 *
 * "At stake" is money that already went out for that reason — deliberately not
 * called a saving, because no fix effectiveness has been measured.
 */
export function FixesTab({ data }: Props) {
  const { summary, reasonMix, products } = data;

  return (
    // Bottom clearance keeps the pager clear of the Ask Glisp pill.
    <div className="flex flex-col gap-4 pb-16">
      <section aria-label="Fix summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Returns with a reason
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.returnsWithReason)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Returned value
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(summary.refundValue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            A page edit could address
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-warning">
            {formatCurrency(summary.fixableValue)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.fixableSharePct}% of returned value
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Products to fix
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.productsCounted)}
          </p>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        Only returns processed through Loop carry a customer reason —{" "}
        <span className="font-medium text-foreground">
          {formatNumber(summary.returnsWithReason)} of{" "}
          {formatNumber(summary.allRefundLines)} refund lines (
          {summary.reasonCoveragePct}%)
        </span>{" "}
        in this period. Refunds raised in store or by an agent are not shown here.
      </p>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Why things came back</h2>
        <ul className="mt-4 flex flex-col gap-2.5">
          {reasonMix.map((mix) => (
            <li key={mix.reason} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{mix.reason}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatNumber(mix.lines)} · {formatCurrency(mix.value)} ·{" "}
                  {mix.sharePct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    isSizing(mix.fix) ? "bg-warning" : "bg-primary",
                  )}
                  style={{ width: `${mix.sharePct}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px]",
                  mix.fix.startsWith(NO_FIX_PREFIX)
                    ? "text-muted-foreground"
                    : "font-medium text-foreground",
                )}
              >
                {mix.fix}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <ReturnFixesTable products={products} />
    </div>
  );
}

/** The table with its own search, fix chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — nothing above it moves. */
function ReturnFixesTable({ products }: { products: ReturnFixProduct[] }) {
  const t = useTableControls(products, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="products"
        facetLabel="Fix"
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
              <th className={HEAD}>Returns</th>
              <th className={HEAD}>Returned value</th>
              <th className={HEAD_LEFT}>Top reason</th>
              <th className={HEAD_LEFT}>Fix</th>
              <th className={HEAD}>At stake</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="products" onClear={t.clear} /> : null}
            {t.rows.map((product) => {
              const noFix = product.fix.startsWith(NO_FIX_PREFIX);
              return (
                <tr
                  key={product.productId}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-accent/40",
                    noFix && "opacity-60",
                  )}
                >
                  <td className="px-3 py-2.5 text-left text-sm font-medium text-foreground">
                    {product.title}
                  </td>
                  <td className={`${CELL} text-muted-foreground`}>
                    {formatNumber(product.returns)}
                  </td>
                  <td className={`${CELL} text-foreground`}>
                    {formatCurrency(product.refundValue)}
                  </td>
                  <td className="px-3 py-2.5 text-left text-sm text-muted-foreground">
                    {product.topReason}
                    <span className="ml-1 text-[11px]">
                      ({product.topReasonSharePct}%)
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-left text-sm",
                      noFix ? "text-muted-foreground" : "font-medium text-foreground",
                    )}
                  >
                    {product.fix}
                  </td>
                  <td className={`${CELL} font-semibold text-warning`}>
                    {formatCurrency(product.valueAtStake)}
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
