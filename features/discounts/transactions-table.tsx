"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/utils/format";
import type { DiscountTransaction } from "@/types/discounts";

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";
const PAGE_SIZE = 15;

function fmtDate(iso: string | null): string {
  return iso ? formatDateTime(iso) : "—"; // store (NY) time — SPEC-129
}

/** An employee's discounted transactions (SPEC-098) — each drills to its items.
 * Paginated (SPEC-138) so a heavy discounter's long history stays light. */
export function TransactionsTable({
  transactions,
  rangeQuery,
}: {
  transactions: DiscountTransaction[];
  rangeQuery: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const slice = transactions.slice(start, start + PAGE_SIZE);

  if (transactions.length === 0) {
    return (
      <div className="rounded-card bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
        No discounted transactions in this range.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Order
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer
              </TableHead>
              <TableHead className={HEAD}>Original</TableHead>
              <TableHead className={HEAD}>Final</TableHead>
              <TableHead className={HEAD}>Discount</TableHead>
              <TableHead className={HEAD}>%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((t) => (
              <TableRow key={t.order_id} className="relative cursor-pointer hover:bg-accent/50">
                <TableCell className="text-sm text-muted-foreground">{fmtDate(t.created_at)}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/discounts/transactions/${t.order_id}${rangeQuery}`}
                    className="outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t.order_number}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{t.location}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.customer_name ?? "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(t.original_value)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(t.final_value)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(t.discount)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {t.discount_pct === null ? "—" : formatPercent(t.discount_pct)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            {start + 1}–{Math.min(start + PAGE_SIZE, transactions.length)} of{" "}
            {formatNumber(transactions.length)}
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
