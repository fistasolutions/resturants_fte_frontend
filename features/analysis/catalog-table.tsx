import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  CatalogVerdictText,
  type VerdictState,
} from "@/features/products/catalog-verdict-cell";
import type { CatalogRow, CatalogStatus } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

const STATUS_STYLES: Record<CatalogStatus, { label: string; className: string }> = {
  best_seller: { label: "Best seller", className: "bg-success/15 text-success" },
  healthy: { label: "Healthy", className: "bg-muted text-muted-foreground" },
  slow: { label: "Slow", className: "bg-warning/15 text-warning" },
  dead_stock: { label: "Dead stock", className: "bg-destructive/15 text-destructive" },
};

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

/** The unified catalog (SPEC-026 §4): sellers ranked by revenue, dead-stock
 * cash sitting at the bottom — every value backend-computed. */
export function CatalogTable({
  rows,
  verdictState,
}: {
  rows: CatalogRow[];
  verdictState?: VerdictState;
}) {
  return (
    <Card className="gap-3 px-4 py-4">
      <div>
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Catalog
        </p>
        <h2 className="text-sm font-semibold">All products</h2>
      </div>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          No product sales in this period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pl-4 text-right font-medium">Units</th>
                <th className="py-2 pl-4 text-right font-medium">Revenue</th>
                <th className="py-2 pl-4 text-right font-medium">Margin</th>
                <th className="py-2 pl-4 text-right font-medium">Disc.</th>
                <th className="py-2 pl-4 text-right font-medium">Return*</th>
                <th className="py-2 pl-4 text-right font-medium">Sell-thru*</th>
                <th className="py-2 pl-4 text-right font-medium">Status</th>
                <th className="min-w-44 py-2 pl-4 font-medium">AI verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = STATUS_STYLES[row.status];
                return (
                  <tr
                    key={row.product_id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="max-w-56 truncate py-2 pr-4 font-medium" title={row.title}>
                      <Link
                        href={`/products/${row.product_id}`}
                        className="rounded-sm hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="max-w-32 truncate py-2 pr-4 text-muted-foreground">
                      {row.category}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {formatNumber(row.units)}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {pct(row.margin_pct)}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {pct(row.discount_pct)}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {pct(row.return_rate_pct)}
                    </td>
                    <td className="py-2 pl-4 text-right tabular-nums">
                      {pct(row.sell_through_pct)}
                    </td>
                    <td className="py-2 pl-4 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2 pl-4 text-xs">
                      <CatalogVerdictText productId={row.product_id} state={verdictState} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
