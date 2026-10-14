import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TransactionDetailPageView } from "@/features/discounts/discount-detail-views";
import { rangeQuery } from "@/lib/discount-tabs";
import { discountQueries } from "@/lib/queries/discounts";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

interface PageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TransactionDetailPage({ params, searchParams }: PageProps) {
  const { orderId } = await params;
  const sp = await searchParams;
  const rq = rangeQuery(sp);
  const id = Number(orderId);
  const queryClient = getQueryClient();
  prefetch(queryClient, discountQueries.transaction(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionDetailPageView orderId={id} rq={rq} />
    </HydrationBoundary>
  );
}
