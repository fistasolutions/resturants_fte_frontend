import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BacklogDrilldownView } from "@/features/warehouse/backlog-drilldown-view";
import { warehouseQueries } from "@/lib/queries/warehouse";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { isBacklogBucket } from "@/lib/warehouse-buckets";

export const metadata: Metadata = { title: "Backlog" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ bucket?: string }>;
}

export default async function BacklogDrilldownPage({ searchParams }: PageProps) {
  const { bucket: raw } = await searchParams;
  const bucket = isBacklogBucket(raw) ? raw : "all";
  const queryClient = getQueryClient();
  prefetch(queryClient, warehouseQueries.backlogOrders(bucket));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BacklogDrilldownView bucket={bucket} />
    </HydrationBoundary>
  );
}
