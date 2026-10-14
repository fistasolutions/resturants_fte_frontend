"use client";

import { Card } from "@/components/ui/card";
import { TableEmptyRow } from "@/components/shared/table-empty-row";
import { TablePager } from "@/components/shared/table-pager";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { useTableControls } from "@/hooks/use-table-controls";
import type { TableSpec } from "@/lib/table-controls";
import { cn } from "@/lib/utils";
import type { ContentGapProduct, ContentGapsData } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/** Search by product or category; facet on the gap (SPEC-258). */
const CONTROLS: TableSpec<ContentGapProduct> = {
  search: (product) => [product.title, product.category],
  facet: (product) => product.gap,
};
const COLUMNS = 6;

/**
 * Products → Content Gaps (SPEC-213). Which selling products have a thin page.
 *
 * There is deliberately no conversion figure: session and impression data are not
 * synced, so a conversion rate would be invented. Revenue per image is what the
 * data supports, and the page says so.
 */
export function ContentGapsView({ data }: { data: ContentGapsData }) {
  const { summary, products } = data;

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Every selling product has a full gallery
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
            Products flagged
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.productsFlagged)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            of {formatNumber(summary.productsSelling)} selling
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Revenue behind them
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatCurrency(summary.revenueBehindThem)}
          </p>
        </Card>
        {summary.byGap.slice(0, 2).map((entry) => (
          <Card key={entry.gap} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {entry.gap}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {formatNumber(entry.products)}
            </p>
          </Card>
        ))}
      </div>

      <ContentGapsTable products={products} />

      <p className="text-xs text-muted-foreground">
        Ranked by revenue, so the products where a missing image costs most come first.
        No conversion rate is shown — session data is not synced, so any figure claiming
        to be one would be invented.
      </p>
    </div>
  );
}

/** The table with its own search, gap chips and pages (SPEC-258). Its state
 * lives here, so paging re-renders this component — nothing above it moves. */
function ContentGapsTable({ products }: { products: ContentGapProduct[] }) {
  const t = useTableControls(products, CONTROLS);
  return (
    <Card className="scroll-mt-4 overflow-hidden p-0">
      <TableToolbar
        noun="products"
        facetLabel="Gap"
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
              <th className={HEAD}>Images</th>
              <th className={HEAD}>Units sold</th>
              <th className={HEAD}>Revenue</th>
              <th className={HEAD}>Revenue / image</th>
              <th className={HEAD_LEFT}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? <TableEmptyRow span={COLUMNS} noun="products" onClear={t.clear} /> : null}
            {t.rows.map((product) => (
              <tr
                key={product.productId}
                className="border-b border-border last:border-0 hover:bg-accent/40"
              >
                <td className="px-3 py-2.5 text-left text-sm">
                  <span className="font-medium text-foreground">{product.title}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {product.category}
                  </span>
                </td>
                <td
                  className={cn(
                    CELL,
                    product.imageCount === 0 ? "font-bold text-destructive" : "text-foreground",
                  )}
                >
                  {product.imageCount}
                </td>
                <td className={`${CELL} text-muted-foreground`}>
                  {formatNumber(product.unitsSold)}
                </td>
                <td className={`${CELL} text-foreground`}>
                  {formatCurrency(product.revenue)}
                </td>
                <td className={`${CELL} text-muted-foreground`}>
                  {product.revenuePerImage === null
                    ? "—"
                    : formatCurrency(product.revenuePerImage)}
                </td>
                <td className="px-3 py-2.5 text-left">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                      product.gap === "No image"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {product.gap}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
          <TablePager page={t.page} pages={t.pages} pageSize={t.pageSize} matches={t.matches} noun="products" onPage={t.setPage} />
</Card>
  );
}
