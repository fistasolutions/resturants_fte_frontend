"use client";

import Link from "next/link";
import { ChevronRight, Clock, DollarSign, Package } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ExplainButton } from "@/features/chat/explain-button";
import { OrdersReview } from "@/features/orders/orders-review";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { filterSummary, locationLabel, type OrderFilters } from "@/lib/order-filters";
import { orderQueries } from "@/lib/queries/orders";
import { reportQueries } from "@/lib/queries/reports";
import { formatCurrency } from "@/utils/format";

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
      <ExplainButton placement="inline" target={{ metric: label, value }} />
    </div>
  );
}

function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href="/orders" className="hover:text-foreground transition-colors">
        Orders
      </Link>
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="font-medium text-foreground">Review &amp; Send</span>
    </nav>
  );
}

interface OrdersReviewViewProps {
  filters: OrderFilters;
  /** The backend query string (`ordersApiQuery(filters)`) — the review's cache key. */
  query: string;
  /** The frontend's own param names, re-parsed by the compose sub-page. */
  frontendQuery: string;
}

/** Review & Send Orders, read from the client cache (SPEC-230). The scopes (for the
 * location label) degrade to an empty list on failure, as before. */
export function OrdersReviewView({ filters, query, frontendQuery }: OrdersReviewViewProps) {
  const review = useApiQuery(orderQueries.reviewByLocation(query));
  const scopes = useApiQuery(reportQueries.scopes());

  if (review.isPending || scopes.isPending) {
    return (
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Breadcrumb />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (review.isError) {
    const err = review.error;
    const message =
      err instanceof ApiError
        ? `Could not load orders (${err.status}) — try refreshing.`
        : "Could not load orders — check your connection and try again.";
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  const data = review.data;
  const locations = scopes.isSuccess ? scopes.data.locations : [];
  const activeLocationName = locationLabel(filters, locations);
  const summary = filterSummary({
    ...filters,
    locationName: activeLocationName ?? filters.locationName,
  });

  const oldestLabel =
    data.oldest_hours >= 24
      ? `${Math.floor(data.oldest_hours / 24)}d ${data.oldest_hours % 24}h`
      : `${data.oldest_hours}h`;

  return (
    <div className="space-y-6 px-6 py-8 md:px-10">
      <Breadcrumb />

      <div>
        <h1 className="font-heading text-2xl tracking-wide">Review &amp; Send Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>

      {data.total_orders > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard icon={Package} label="Orders" value={String(data.total_orders)} />
          <KpiCard icon={DollarSign} label="Total value" value={formatCurrency(data.total_value)} />
          <KpiCard icon={Clock} label="Oldest order" value={data.oldest_hours > 0 ? oldestLabel : "—"} />
        </div>
      )}

      <OrdersReview key={query} initial={data} frontendQuery={frontendQuery} />
    </div>
  );
}
