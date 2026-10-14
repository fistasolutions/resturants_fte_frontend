import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposeOrdersView } from "@/features/orders/compose-orders-view";
import { filterSummary, ordersApiQuery, parseOrderFilters } from "@/lib/order-filters";
import { orderQueries } from "@/lib/queries/orders";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Send Orders List" };
export const dynamic = "force-dynamic";

interface ComposeOrdersPageProps {
  params: Promise<{ locationKey: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ComposeOrdersPage({ params, searchParams }: ComposeOrdersPageProps) {
  const { locationKey } = await params;
  const rawParams = await searchParams;
  const filters = parseOrderFilters(rawParams);
  const query = ordersApiQuery(filters);
  const summary = filterSummary(filters);

  const backQuery = new URLSearchParams(
    Object.entries(rawParams).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();
  const backHref = backQuery ? `/orders/review?${backQuery}` : "/orders/review";

  const queryClient = getQueryClient();
  prefetch(queryClient, orderQueries.reviewByLocation(query));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposeOrdersView
        locationKey={locationKey}
        query={query}
        summary={summary}
        backHref={backHref}
      />
    </HydrationBoundary>
  );
}
