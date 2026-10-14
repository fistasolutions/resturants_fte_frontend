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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** Grid-of-cards view of the catalog (SPEC-093) — same rows as `CatalogTable`,
 * one card per product with its full figure set. Values are backend-computed;
 * the card only presents them. No image (the row carries none). */
export function CatalogGrid({
  rows,
  verdictState,
}: {
  rows: CatalogRow[];
  verdictState?: VerdictState;
}) {
  if (rows.length === 0) {
    return (
      <Card className="px-6 py-8 text-center text-sm text-muted-foreground">
        No product sales in this period.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const status = STATUS_STYLES[row.status];
        return (
          <Link
            key={row.product_id}
            href={`/products/${row.product_id}`}
            aria-label={`View ${row.title}`}
            className="block rounded-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Card className="h-full gap-3 px-4 py-4 transition-colors hover:border-foreground/20 hover:bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold" title={row.title}>
                  {row.title}
                </h3>
                <p className="truncate text-xs text-muted-foreground">{row.category}</p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-border/50 pt-3">
              <Metric label="Units" value={formatNumber(row.units)} />
              <Metric label="Revenue" value={formatCurrency(row.revenue)} />
              <Metric label="Margin" value={pct(row.margin_pct)} />
              <Metric label="Return" value={pct(row.return_rate_pct)} />
              <Metric label="Sell-thru" value={pct(row.sell_through_pct)} />
              <Metric label="Stock" value={formatNumber(row.stock)} />
            </div>
            <div className="flex items-start gap-2 border-t border-border/50 pt-3">
              <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                AI
              </span>
              <span className="text-xs">
                <CatalogVerdictText productId={row.product_id} state={verdictState} />
              </span>
            </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
