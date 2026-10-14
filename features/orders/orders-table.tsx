import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiOrder } from "@/lib/adapters";
import { formatCurrency, formatDate } from "@/utils/format";

function hoursAgo(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
}

function fulfillmentBadge(status: string | null, createdAt: string) {
  if (status === "fulfilled") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-success/10 text-success border border-success/20">
        Fulfilled
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-warning/10 text-warning border border-warning/20">
        Partial
      </span>
    );
  }
  const hours = hoursAgo(createdAt);
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-destructive/10 text-destructive border border-destructive/20">
      Unfulfilled{hours > 0 ? ` · ${hours}h` : ""}
    </span>
  );
}

interface OrdersTableProps {
  orders: ApiOrder[];
  /** Current tab+filters+page URL (SPEC-080) — carried onto each row's link
   * so the order detail breadcrumb can return to exactly this view. */
  returnTo?: string;
}

/**
 * Orders list, each row drilling into its own page (SPEC-061, backend
 * SPEC-055) — a real sub-page under Orders (breadcrumb: Orders / #name), not
 * an overlay, so it's bookmarkable and works with the browser back button.
 * No client JS needed: the "stretched link" pattern (a real `<Link>` in the
 * order-number cell, `after:absolute after:inset-0` against the row's
 * `relative` positioning) makes the whole row a single accessible click
 * target — ctrl/cmd-click and "open in new tab" work natively, and a screen
 * reader announces one link per row named by the order number already
 * visible in that cell.
 */
export function OrdersTable({ orders, returnTo }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-8" aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="relative">
              <TableCell className="font-medium">
                <Link
                  href={
                    returnTo
                      ? `/orders/${order.id}?returnTo=${encodeURIComponent(returnTo)}`
                      : `/orders/${order.id}`
                  }
                  className="after:absolute after:inset-0 hover:underline"
                >
                  {order.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell>{order.customer_name ?? "Guest"}</TableCell>
              <TableCell className="text-muted-foreground">
                {order.location ?? "Online"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {order.items_count ?? 0}
              </TableCell>
              <TableCell>{fulfillmentBadge(order.fulfillment_status, order.created_at)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(order.total_price)}
              </TableCell>
              <TableCell>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
