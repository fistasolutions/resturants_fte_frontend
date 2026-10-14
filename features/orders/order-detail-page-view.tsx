"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetailView } from "@/features/orders/order-detail-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { adaptOrderDetail } from "@/lib/adapters";
import { orderQueries } from "@/lib/queries/orders";
import { formatDate } from "@/utils/format";

interface OrderDetailPageViewProps {
  orderId: string;
  /** Validated `returnTo` (SPEC-080) — the exact tab/filters/page the row was opened from. */
  ordersHref: string;
}

function Breadcrumb({ ordersHref, current }: { ordersHref: string; current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link href={ordersHref} className="hover:text-foreground transition-colors">
        Orders
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="font-medium text-foreground">{current}</span>
    </nav>
  );
}

/** One order (SPEC-061), read from the client cache (SPEC-230). */
export function OrderDetailPageView({ orderId, ordersHref }: OrderDetailPageViewProps) {
  const order = useApiQuery(orderQueries.detail(orderId));

  if (order.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Breadcrumb ordersHref={ordersHref} current="Order" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (order.isError) {
    const err = order.error;
    const message =
      err instanceof ApiError && err.status === 404
        ? "This order doesn't exist or has been removed."
        : err instanceof ApiError
          ? `Could not load this order (${err.status}) — try refreshing.`
          : "Could not load this order — check your connection and try again.";
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Breadcrumb ordersHref={ordersHref} current="Order" />
        <p className="py-12 text-center text-sm text-destructive">{message}</p>
      </div>
    );
  }

  const detail = adaptOrderDetail(order.data);

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <Breadcrumb ordersHref={ordersHref} current={detail.name} />

      <div>
        <h1 className="font-heading text-2xl tracking-wide">{detail.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Placed {formatDate(detail.createdAt)}
        </p>
      </div>

      <OrderDetailView detail={detail} />
    </div>
  );
}
