"use client";

import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { formatDuration } from "@/lib/format-duration";
import { warehouseQueries } from "@/lib/queries/warehouse";
import { formatDate, formatNumber } from "@/utils/format";

/** One packer's orders, read from the client cache (SPEC-230). */
export function PackerDrilldownView({ packer, range }: { packer: string; range: ResolvedRange }) {
  const warehouseHref = `/warehouse?range=custom&from=${range.from}&to=${range.to}`;
  const result = useApiQuery(warehouseQueries.packerOrders(packer, range.from, range.to));
  const failed = result.isError;
  const data = result.data ?? null;
  if (result.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-96 rounded-card" />
      </main>
    );
  }

  const orders = data?.orders ?? [];

  return (
    <main className="space-y-6 p-4 md:p-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href={warehouseHref} className="hover:text-foreground hover:underline">
          Warehouse
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">{packer}</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide md:text-3xl">{packer}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {range.label} · {formatNumber(orders.length)} order
          {orders.length === 1 ? "" : "s"} packed
        </p>
      </div>

      {failed ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this packer&apos;s orders right now. Try again shortly.
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No packed orders for {packer} in this period.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Packed at</TableHead>
                <TableHead className="text-right">Pack time</TableHead>
                <TableHead className="text-right">Lead time</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Deviation</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.order_number}>
                  <TableCell className="font-medium tabular-nums text-foreground">
                    {o.order_number}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.checked_at ? formatDate(o.checked_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.pack_seconds != null ? formatDuration(o.pack_seconds) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.lead_seconds != null ? formatDuration(o.lead_seconds) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.item_quantity != null ? formatNumber(o.item_quantity) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {o.line_count != null ? formatNumber(o.line_count) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {o.deviation ? (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <TriangleAlert className="size-3.5" aria-hidden /> Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={o.note ?? undefined}>
                    {o.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
