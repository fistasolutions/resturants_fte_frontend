import Link from "next/link";
import { X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatRate, rateTone } from "@/lib/returns-format";
import type { StyleRow } from "@/types/returns-intel";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

import { RATE_PILL_CLASS } from "./tone";

export function ByStyleTab({
  styles,
  rangeQuery,
  category,
}: {
  styles: StyleRow[];
  rangeQuery: string;
  /** Optional category drill-down filter (from the Categories tab). */
  category?: string;
}) {
  const visible = category
    ? styles.filter((style) => (style.category ?? "Uncategorized") === category)
    : styles;

  return (
    <div className="space-y-3">
      {category && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by category:</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-medium text-foreground">
            {category}
            <Link
              href={`/returns?tab=by-style&${rangeQuery}`}
              aria-label="Clear category filter"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Link>
          </span>
        </div>
      )}
      {visible.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No returned styles in {category ?? "this period"}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Style</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Sold</TableHead>
            <TableHead className="text-right">Returned</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead>Top reason</TableHead>
            <TableHead className="text-right">Profit lost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((style) => (
            <TableRow key={style.product_id} className="group">
              <TableCell className="max-w-[220px]">
                <Link
                  href={`/returns/style/${style.product_id}?${rangeQuery}`}
                  className="block"
                >
                  <span className="block truncate font-medium text-foreground group-hover:underline">
                    {style.style_name ?? `#${style.product_id}`}
                  </span>
                  <span className="text-xs text-muted-foreground">{style.style_code ?? "—"}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{style.category ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(style.units_sold)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(style.units_returned)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-block rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                    RATE_PILL_CLASS[rateTone(style.return_rate)],
                  )}
                >
                  {formatRate(style.return_rate)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(style.revenue)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {style.margin_pct !== null ? formatPercent(style.margin_pct * 100) : "—"}
              </TableCell>
              <TableCell className="max-w-[180px] truncate text-muted-foreground">
                {style.top_reason ?? "—"}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-destructive">
                {formatCurrency(style.profit_lost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </div>
      )}
    </div>
  );
}
