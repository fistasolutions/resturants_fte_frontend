import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StoreDetailPageView } from "@/features/traffic/store-detail-page-view";
import { trafficQueries } from "@/lib/queries/traffic";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { resolveTrafficRange } from "@/lib/traffic-tabs";

export const metadata: Metadata = { title: "Store detail" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

export default async function StoreDetailPage({ params, searchParams }: PageProps) {
  const { locationId } = await params;
  const range = resolveTrafficRange(await searchParams);
  const id = Number(locationId);
  const queryClient = getQueryClient();
  prefetch(queryClient, trafficQueries.storeDetail(id, range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StoreDetailPageView locationId={id} range={range} />
    </HydrationBoundary>
  );
}
