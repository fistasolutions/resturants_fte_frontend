"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiscountItem } from "@/types/discounts";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";
const PAGE_SIZE = 12;

function pctChipCls(pct: number | null): string {
  if (pct === null || pct === 0) return "bg-muted text-muted-foreground";
  if (pct >= 50) return "bg-destructive/10 text-destructive";
  if (pct >= 25) return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
}

/** All line items of an order (SPEC-138) — paginated so a large order stays light.
 * A whole-order discount (not tied to any line) is surfaced as a banner so the
 * page never looks empty or short of the order total. */
export function OrderItemsTable({
  items,
  orderLevelDiscount,
}: {
  items: DiscountItem[];
  orderLevelDiscount: number;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Order items</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(items.length)} item{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {orderLevelDiscount > 0 && (
        <div className="flex items-start gap-2 border-b border-warning/30 bg-warning/5 px-4 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          <span>
            A whole-order discount of{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(orderLevelDiscount)}
            </span>{" "}
            was applied to this order — not to the specific items below.
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          No line items recorded for this order.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Product
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  SKU
                </TableHead>
                <TableHead className={HEAD}>Original</TableHead>
                <TableHead className={HEAD}>Final</TableHead>
                <TableHead className={HEAD}>Discount</TableHead>
                <TableHead className={HEAD}>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((it, i) => (
                <TableRow key={start + i}>
                  <TableCell className="text-sm font-medium text-foreground">{it.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {it.sku ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground line-through">
                    {formatCurrency(it.original_value)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(it.final_value)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {it.discount > 0 ? `−${formatCurrency(it.discount)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${pctChipCls(it.discount_pct)}`}
                    >
                      {it.discount > 0 && it.discount_pct ? formatPercent(it.discount_pct) : "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            {start + 1}–{Math.min(start + PAGE_SIZE, items.length)} of {formatNumber(items.length)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(current - 1)} disabled={current === 0}>
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {current + 1} / {pages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
