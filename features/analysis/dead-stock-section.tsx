import Link from "next/link";
import { ArrowRight, PackageX } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { DeadStockAged } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

interface DeadStockSectionProps {
  data: DeadStockAged | null;
  /** Raw query string forwarded to the markdown-plan page, e.g. "start=…&end=…" */
  query: string;
}

/** Dead stock aged-bucket section (SPEC-045/050/051). Server component. */
export function DeadStockSection({ data, query }: DeadStockSectionProps) {
  const sectionLabel = (
    <div className="flex items-center gap-3">
      <p className="shrink-0 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Dead Stock
      </p>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );

  if (!data) {
    return (
      <section aria-label="Dead stock analysis">
        {sectionLabel}
        <Card className="mt-2 flex items-center gap-3 px-4 py-4">
          <PackageX className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No dead stock found in this period.
          </p>
        </Card>
      </section>
    );
  }

  const { buckets } = data;
  const totalProducts = buckets.d90_180.products + buckets.d180_plus.products;
  const totalFrozen = buckets.d90_180.stock_value + buckets.d180_plus.stock_value;

  if (totalProducts === 0) {
    return (
      <section aria-label="Dead stock analysis">
        {sectionLabel}
        <Card className="mt-2 flex items-center gap-3 px-4 py-4">
          <PackageX className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No dead stock found for 90+ days.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Dead stock analysis" className="space-y-3">
      {sectionLabel}

      {/* Hero */}
      <Card className="gap-1 border-destructive/20 bg-destructive/[0.03] px-5 py-4">
        <p className="text-sm font-semibold text-foreground">
          {formatNumber(totalProducts)}{" "}
          {totalProducts === 1 ? "product" : "products"} unsold 90+ days
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatCurrency(totalFrozen)}
          </span>{" "}
          in cash frozen — markdown to recover it
        </p>
      </Card>

      {/* Bucket table + plan button footer */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Bucket
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Products
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Frozen $
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">90–180 days</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatNumber(buckets.d90_180.products)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                  {formatCurrency(buckets.d90_180.stock_value)}
                </td>
              </tr>
              <tr className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-destructive">180+ days</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {formatNumber(buckets.d180_plus.products)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-destructive">
                  {formatCurrency(buckets.d180_plus.stock_value)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end border-t border-border px-4 py-3">
          <Link
            href={`/inventory/markdown-plan?${query}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Open markdown plan
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </Card>
    </section>
  );
}
