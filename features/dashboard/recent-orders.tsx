import Link from "next/link";

import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderStatus, RecentOrder } from "@/types/orders";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/format";

/** Panel-style column headers — the shadcn default is a full-size label. */
const HEAD = "h-9 px-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground";
const CELL = "px-3 py-2";

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-success/15 text-success" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning" },
  refunded: {
    label: "Refunded",
    className: "bg-destructive/15 text-destructive",
  },
};

interface RecentOrdersProps {
  orders: RecentOrder[];
}

/**
 * The latest orders, as a panel (SPEC-233) with a link to the full list. Since
 * SPEC-287 the panel is the main column's last child and fills whatever height the
 * rail leaves: `lg:contain-size` gives it no intrinsic height (a `flex-basis: 0%`
 * alone still counts the rows in Chrome's column-flex intrinsic sizing), so it never
 * drives the row, and `lg:flex-1` grows it into what is left; the rows the height
 * cannot show scroll inside the body under a sticky header. Under `lg` it takes its
 * natural height, capped at 480px.
 */
export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Panel
      title="Recent orders"
      count={orders.length > 0 ? `latest ${orders.length}` : undefined}
      className="flex min-h-80 flex-col lg:flex-1 lg:contain-size"
      bodyClassName="scrollbar-subtle min-h-0 flex-1 overflow-y-auto max-lg:max-h-[480px]"
      aside={
        <Link
          href="/orders"
          className="rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          All orders →
        </Link>
      }
    >
      {orders.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No orders in this period</p>
      ) : (
        <Table containerClassName="overflow-x-visible">
          {/* The hairline is an inset shadow: a collapsed border does not travel with
              a sticky header. */}
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_0_var(--color-border)] [&_tr]:border-0">
            <TableRow>
              <TableHead className={cn(HEAD, "pl-4")}>Order</TableHead>
              <TableHead className={HEAD}>Customer</TableHead>
              <TableHead className={cn(HEAD, "text-right")}>Total</TableHead>
              <TableHead className={HEAD}>Status</TableHead>
              <TableHead className={cn(HEAD, "pr-4 text-right")}>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const status = statusStyles[order.status];
              return (
                <TableRow key={order.id}>
                  <TableCell className={cn(CELL, "pl-4 font-medium")}>{order.number}</TableCell>
                  <TableCell className={CELL}>{order.customerName}</TableCell>
                  <TableCell className={cn(CELL, "text-right font-medium tabular-nums")}>
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className={CELL}>
                    <Badge className={status.className}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className={cn(CELL, "pr-4 text-right text-muted-foreground")}>
                    {formatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
