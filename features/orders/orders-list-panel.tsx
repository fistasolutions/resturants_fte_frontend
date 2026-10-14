"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import OrdersLoading from "@/app/(app)/orders/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OrdersTable } from "@/features/orders/orders-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { ordersPageHref, type OrderFilters } from "@/lib/order-filters";
import { orderQueries } from "@/lib/queries/orders";

interface OrdersListPanelProps {
  /** Current fulfillment/location/age/date/search filters — held fixed;
   * only `page` changes as this panel pages through results itself. */
  filters: OrderFilters;
  pageSize: number;
  /** Empty-state copy when there's no active search (SPEC-079 — each Orders
   * tab names what's missing, e.g. "No returned orders..."). */
  emptyMessage?: string;
  /** Active tab's route (SPEC-080) — used to build each row's `returnTo` so
   * the order detail breadcrumb comes back to this exact tab/page. */
  basePath: string;
}

/** Orders table + pagination (SPEC-038; client-side paging SPEC-063; cached
 * SPEC-230). Every page is its own cache entry keyed by filters + page, so the
 * first page is streamed in by the server, a page visited before paints instantly,
 * and a new page keeps the previous rows on screen (dimmed) until it arrives.
 * Changing a filter (FiltersBar/DateRangePicker/search) still navigates, since
 * those legitimately change what "Export CSV" and "Send to manager" point at. */
export function OrdersListPanel({
  filters,
  pageSize,
  emptyMessage = "No orders match the active filters.",
  basePath,
}: OrdersListPanelProps) {
  const [page, setPage] = useState(filters.page);
  const orders = useApiQuery(orderQueries.list({ ...filters, page }, pageSize), {
    placeholderData: keepPreviousData,
  });
  const returnTo = ordersPageHref(filters, page, basePath);

  if (orders.isPending) return <OrdersLoading />;
  if (orders.isError) {
    return <QueryErrorState error={orders.error} onRetry={() => void orders.refetch()} />;
  }

  const data = orders.data;
  const loading = orders.isPlaceholderData;
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <>
      <Card className="gap-0 p-0">
        {data.items.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            {filters.q
              ? `No orders match "${filters.q}" with the active filters.`
              : emptyMessage}
          </p>
        ) : (
          <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
            <OrdersTable orders={data.items} returnTo={returnTo} />
          </div>
        )}
      </Card>

      {data.total > pageSize && (
        <nav aria-label="Order pages" className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages} · {data.total} orders
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </nav>
      )}
    </>
  );
}
