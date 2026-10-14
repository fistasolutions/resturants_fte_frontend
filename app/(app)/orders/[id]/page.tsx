import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OrderDetailPageView } from "@/features/orders/order-detail-page-view";
import { isSafeOrdersReturnPath } from "@/lib/order-filters";
import { orderQueries } from "@/lib/queries/orders";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { id } = await params;
  const { returnTo: rawReturnTo } = await searchParams;
  // SPEC-080: return to the exact tab/filters/page the row was opened from —
  // never trust the param as a redirect target without validating it first.
  const ordersHref =
    rawReturnTo && isSafeOrdersReturnPath(rawReturnTo) ? rawReturnTo : "/orders";

  const queryClient = getQueryClient();
  prefetch(queryClient, orderQueries.detail(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrderDetailPageView orderId={id} ordersHref={ordersHref} />
    </HydrationBoundary>
  );
}
