import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OrdersReviewView } from "@/features/orders/orders-review-view";
import { ordersApiQuery, parseOrderFilters } from "@/lib/order-filters";
import { orderQueries } from "@/lib/queries/orders";
import { reportQueries } from "@/lib/queries/reports";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Review & Send Orders" };
export const dynamic = "force-dynamic";

interface ReviewPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function OrdersReviewPage({ searchParams }: ReviewPageProps) {
  const rawParams = await searchParams;
  const filters = parseOrderFilters(rawParams);
  const query = ordersApiQuery(filters);
  // The compose sub-page re-parses this with parseOrderFilters, so it must
  // carry the frontend's own param names (from/to, q, loc_name…), not the
  // backend query string in `query` (start/end, search…) — they differ.
  const frontendQuery = new URLSearchParams(
    Object.entries(rawParams).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();

  const queryClient = getQueryClient();
  prefetch(queryClient, orderQueries.reviewByLocation(query));
  prefetch(queryClient, reportQueries.scopes());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersReviewView filters={filters} query={query} frontendQuery={frontendQuery} />
    </HydrationBoundary>
  );
}
