"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrdersReviewByLocation } from "@/lib/queries/orders";
import { formatCurrency } from "@/utils/format";

interface OrdersReviewProps {
  initial: OrdersReviewByLocation;
  /** The frontend's own query string (from/to, q, loc_name…) — carried
   * forward to the compose sub-page so it can reconstruct the same filters. */
  frontendQuery: string;
}

function HoursChip({ hours }: { hours: number }) {
  const label = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
  const cls =
    hours >= 48
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : hours >= 24
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${cls}`}
    >
      {label}
    </span>
  );
}

/** Pure display + navigation (SPEC-066) — every send action (single
 * location or bulk) happens on its own compose page, reached via `Link`;
 * this component never sends anything itself. Unlike overdue/transfer,
 * orders sends have no persisted "sent" status (the backend tracks them
 * as an append-only history log, not a daily decision — SPEC-062), so
 * there's no sent/pending badge here at all. */
export function OrdersReview({ initial, frontendQuery }: OrdersReviewProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initial.sheets[0]?.location_key ?? null,
  );

  const selected =
    initial.sheets.find((s) => s.location_key === selectedKey) ?? initial.sheets[0] ?? null;

  if (initial.sheets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No orders match the active filters.</p>
      </div>
    );
  }

  const sendAllHref = frontendQuery
    ? `/orders/review/send-all?${frontendQuery}`
    : "/orders/review/send-all";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {initial.sheets.length} location{initial.sheets.length === 1 ? "" : "s"} match the
          active filters.
        </p>
        <Button type="button" asChild>
          <Link href={sendAllHref}>Send All Remaining</Link>
        </Button>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-4 md:h-[70vh] md:min-h-[480px] md:grid-cols-[280px_1fr]">
        {/* Left rail */}
        <div className="space-y-1.5 md:overflow-y-auto md:pr-1">
          {initial.sheets.map((sheet) => (
            <button
              key={sheet.location_key}
              type="button"
              onClick={() => setSelectedKey(sheet.location_key)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                sheet.location_key === selectedKey
                  ? "border-foreground/40 bg-muted/60"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
            >
              <span className="text-sm font-semibold truncate">{sheet.location_name}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatCurrency(sheet.total_value)} · {sheet.orders.length} order
                {sheet.orders.length === 1 ? "" : "s"}
              </p>
            </button>
          ))}
        </div>

        {/* Right panel */}
        {selected && (
          <div className="flex flex-col rounded-xl border border-border bg-card p-5 md:overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-sm font-semibold">{selected.location_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(selected.total_value)} · {selected.orders.length} order
                  {selected.orders.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link
                  href={`/orders/review/send/${selected.location_key}${
                    frontendQuery ? `?${frontendQuery}` : ""
                  }`}
                >
                  Send this list
                </Link>
              </Button>
            </div>

            <div className="mt-4 flex-1 md:overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.orders.map((order, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{order.order_name}</TableCell>
                      <TableCell className="text-muted-foreground">{order.customer}</TableCell>
                      <TableCell>
                        <HoursChip hours={order.hours} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(order.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
