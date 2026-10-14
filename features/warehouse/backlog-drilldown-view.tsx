"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
import { warehouseQueries } from "@/lib/queries/warehouse";
import { cn } from "@/lib/utils";
import { BACKLOG_BUCKETS, bucketMeta } from "@/lib/warehouse-buckets";
import type { BacklogBucket } from "@/types/warehouse";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

/** Unfulfilled backlog drill-down, read from the client cache (SPEC-230). */
export function BacklogDrilldownView({ bucket }: { bucket: BacklogBucket }) {
  const meta = bucketMeta(bucket);
  const backlog = useApiQuery(warehouseQueries.backlogOrders(bucket));
  const failed = backlog.isError;
  const data = backlog.data ?? null;
  if (backlog.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-8 w-80 max-w-full rounded-full" />
        <Skeleton className="h-96 rounded-card" />
      </main>
    );
  }

  const orders = data?.orders ?? [];

  return (
    <main className="space-y-6 p-4 md:p-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/warehouse" className="hover:text-foreground hover:underline">
          Warehouse
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">Backlog</span>
      </nav>

      <div>
        <h1 className="font-heading text-2xl tracking-wide md:text-3xl">Unfulfilled backlog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders still waiting to ship — {meta.window}. Oldest first.
        </p>
      </div>

      {/* Bucket filter */}
      <div className="flex flex-wrap gap-2">
        {BACKLOG_BUCKETS.map((b) => (
          <Link
            key={b.key}
            href={`/warehouse/backlog?bucket=${b.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              b.key === bucket
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {b.label}
          </Link>
        ))}
      </div>

      {failed ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
          We couldn&apos;t load the backlog right now. Try again shortly.
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nothing waiting in this bucket 🎉
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {formatNumber(orders.length)} order{orders.length === 1 ? "" : "s"}
          </p>
          <div className="overflow-x-auto rounded-card border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Age</TableHead>
                  <TableHead className="text-right">Ordered</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.order_number}>
                    <TableCell className="font-medium tabular-nums text-foreground">
                      {o.order_number}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        o.age_days > 7 ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {formatNumber(o.age_days)}d
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {o.created_at ? formatDate(o.created_at) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {o.total_price != null ? formatCurrency(o.total_price) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </main>
  );
}
