"use client";

import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiStat } from "@/features/returns/kpi-stat";
import { ReasonBar } from "@/features/returns/reason-bar";
import { SizeHeatGrid } from "@/features/returns/size-heat-grid";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { returnQueries } from "@/lib/queries/returns";
import { formatRate, recommendationLabel, recommendationReason } from "@/lib/returns-format";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types/returns-intel";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/utils/format";

const REC_CLASS: Record<Recommendation, string> = {
  keep: "bg-success/15 text-success",
  fix: "bg-warning/15 text-warning",
  kill: "bg-destructive/15 text-destructive",
};

/** One style's returns (SPEC-087), read from the client cache (SPEC-230). A failed
 * or empty answer renders the same "no returns" state as before. */
export function StyleDetailView({ productId, range }: { productId: number; range: ResolvedRange }) {
  const rangeQuery = new URLSearchParams({ from: range.from, to: range.to }).toString();
  const result = useApiQuery(returnQueries.styleDetail(productId, { from: range.from, to: range.to }));
  if (result.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </main>
    );
  }
  const detail = result.data ?? null;

  if (!detail || !detail.has_data) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Link
          href={`/returns?tab=by-style&${rangeQuery}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Returns
        </Link>
        <div className="rounded-card border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No returns for this style in the selected period.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <Link
        href={`/returns?tab=by-style&${rangeQuery}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Returns
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl tracking-wide">
            {detail.style_name ?? `#${detail.product_id}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.style_code ?? "—"} · {detail.category ?? "Uncategorized"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold",
              REC_CLASS[detail.recommendation],
            )}
          >
            {recommendationLabel(detail.recommendation)}
          </span>
          <span className="max-w-64 text-right text-xs text-muted-foreground">
            {recommendationReason(detail.recommendation)}
          </span>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiStat label="Units Sold" value={formatNumber(detail.units_sold)} />
        <KpiStat label="Units Returned" value={formatNumber(detail.units_returned)} />
        <KpiStat label="Return Rate" value={formatRate(detail.return_rate)} />
        <KpiStat label="Revenue" value={formatCurrency(detail.revenue)} />
        <KpiStat
          label="Margin"
          value={detail.margin_pct !== null ? formatPercent(detail.margin_pct * 100) : "—"}
        />
        <KpiStat
          label="Profit Lost"
          value={formatCurrency(detail.profit_lost)}
          emphasis
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-5">
          <h2 className="font-heading text-sm tracking-wide">Return rate by size</h2>
          {detail.sizes.some((s) => s.flagged) && (
            <p className="inline-flex items-center gap-1 text-xs text-destructive">
              <TriangleAlert className="size-3" /> Ringed sizes return well above this style&apos;s
              rate — a likely fit/grading issue.
            </p>
          )}
          <SizeHeatGrid sizes={detail.sizes} />
        </Card>

        <Card className="gap-4 p-5">
          <h2 className="font-heading text-sm tracking-wide">Why it&apos;s returned</h2>
          <ReasonBar reasons={detail.reason_mix} />
        </Card>
      </div>

      <Card className="gap-4 p-5">
        <h2 className="font-heading text-sm tracking-wide">Recent returns</h2>
        {detail.recent_returns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No individual returns to show.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.recent_returns.map((ret, index) => (
              <li
                key={`${ret.order_id ?? "x"}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground">
                    {ret.order_id ? (
                      <Link
                        href={`/orders/${ret.order_id}`}
                        className="font-medium hover:underline"
                      >
                        {ret.order_name ?? `Order ${ret.order_id}`}
                      </Link>
                    ) : (
                      <span className="font-medium">{ret.order_name ?? "—"}</span>
                    )}
                    {ret.variant_title && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ret.variant_title}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ret.reason ?? "No reason"}
                    {ret.returned_on ? ` · ${formatDate(ret.returned_on)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {ret.outcome && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {ret.outcome}
                    </span>
                  )}
                  <span
                    className="tabular-nums text-muted-foreground"
                    title="Value of the returned item"
                  >
                    {formatCurrency(ret.item_value)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
