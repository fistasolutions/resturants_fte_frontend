"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeadInventoryAlert } from "@/types/analysis";
import { formatCurrency, formatNumber, formatTime } from "@/utils/format";

const PAGE_SIZE = 10;

interface DeadInventoryReviewProps {
  initialAlerts: DeadInventoryAlert[];
}

function alertKey(alert: DeadInventoryAlert): string {
  return `${alert.product_id}:${alert.location_id}`;
}

function alertHref(alert: DeadInventoryAlert): string {
  return `/inventory/dead-inventory-alerts/${alert.product_id}/${alert.location_id}`;
}

/** Compact idle context — the "why this is dead" bit, short enough for a table cell. */
function formatIdle(days: number | null): string {
  if (days === null) return "never sold here";
  if (days === 0) return "sold today · now idle";
  return `${formatNumber(days)}d since sale`;
}

function formatSentAt(iso: string): string {
  return formatTime(iso); // store (NY) time — SPEC-129
}

function ElsewhereCell({ alert }: { alert: DeadInventoryAlert }) {
  if (alert.selling_elsewhere.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex max-w-52 flex-wrap items-center gap-1">
      {alert.selling_elsewhere.map((e) => (
        <Badge key={e.location_name} variant="secondary" className="gap-1 font-normal">
          <span className="truncate">{e.location_name}</span>
          <span className="font-medium text-foreground">{formatNumber(e.units_sold)}</span>
        </Badge>
      ))}
    </div>
  );
}

function SizesCell({ alert }: { alert: DeadInventoryAlert }) {
  const sizes = alert.size_breakdown;
  if (sizes.length === 0) return <span className="text-muted-foreground">—</span>;
  const shown = sizes.slice(0, 3);
  const hidden = sizes.slice(3);
  const remainingUnits = hidden.reduce((sum, s) => sum + s.units, 0);
  return (
    <div className="flex max-w-48 flex-wrap items-center gap-1">
      {shown.map((size, i) => (
        <Badge
          key={`${size.sku ?? size.variant_title}-${i}`}
          variant="outline"
          className="font-normal"
        >
          {size.variant_title} · {formatNumber(size.units)}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          +{formatNumber(hidden.length)} ({formatNumber(remainingUnits)})
        </span>
      )}
    </div>
  );
}

export function DeadInventoryReview({ initialAlerts }: DeadInventoryReviewProps) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(initialAlerts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = useMemo(
    () => initialAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [initialAlerts, currentPage],
  );
  const pendingCount = initialAlerts.reduce((n, a) => (a.sent ? n : n + 1), 0);

  if (initialAlerts.length === 0) {
    return (
      <div className="rounded-card bg-card px-4 py-8 text-center ring-1 ring-foreground/10">
        <p className="text-sm font-medium text-foreground">Nothing sitting on the wrong shelf.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No style currently has idle stock at one location while selling at another.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="max-h-[70vh] overflow-auto scrollbar-subtle">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 w-8 pl-4 pr-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Style
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Location · idle
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Stock
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Value
              </TableHead>
              <TableHead className="h-9 px-2 text-right text-[10px] font-semibold uppercase tracking-widest">
                Gap
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Selling elsewhere
              </TableHead>
              <TableHead className="h-9 px-2 text-[10px] font-semibold uppercase tracking-widest">
                Sizes
              </TableHead>
              <TableHead className="h-9 w-40 pl-2 pr-4 text-right text-[10px] font-semibold uppercase tracking-widest">
                <span className="sr-only">Status and action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((alert, i) => {
              const key = alertKey(alert);
              const rank = (currentPage - 1) * PAGE_SIZE + i + 1;
              return (
                <TableRow key={key} className="group relative align-top">
                  <TableCell className="py-2 pl-4 pr-1 text-xs tabular-nums text-muted-foreground">
                    {String(rank).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="max-w-56 py-2 px-2">
                    <Link
                      href={alertHref(alert)}
                      className="block truncate text-sm font-semibold leading-tight text-foreground outline-none transition-colors after:absolute after:inset-0 after:content-[''] hover:text-foreground/80 focus-visible:underline"
                      aria-label={`Open ${alert.title} at ${alert.location_name}`}
                    >
                      {alert.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatNumber(alert.sales_gap)}-unit gap to cover
                    </p>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {alert.location_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatIdle(alert.days_since_last_sale)}
                    </p>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums">
                    {formatNumber(alert.stock)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm font-semibold tabular-nums text-warning">
                    {formatCurrency(alert.stock_value)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-sm tabular-nums">
                    {formatNumber(alert.sales_gap)}
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <ElsewhereCell alert={alert} />
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <SizesCell alert={alert} />
                  </TableCell>
                  <TableCell className="relative z-10 py-2 pl-2 pr-4">
                    <div className="flex flex-col items-end gap-1">
                      {alert.sent ? (
                        <div className="flex items-center gap-2">
                          <p className="flex items-center gap-1 text-xs font-medium text-success">
                            <Check className="size-3.5" aria-hidden />
                            Sent {alert.sent_at ? formatSentAt(alert.sent_at) : ""}
                          </p>
                          <Button variant="outline" size="xs" asChild>
                            <Link
                              href={`/inventory/dead-inventory-alerts/${alert.product_id}/${alert.location_id}/send`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="xs" asChild>
                          <Link
                            href={`/inventory/dead-inventory-alerts/${alert.product_id}/${alert.location_id}/send`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail aria-hidden />
                            {`Send to ${alert.location_name}`}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {initialAlerts.length - pendingCount} of {formatNumber(initialAlerts.length)}
          </span>{" "}
          sent · {pendingCount} pending
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden />
            Prev
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={currentPage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Next page"
          >
            Next
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
