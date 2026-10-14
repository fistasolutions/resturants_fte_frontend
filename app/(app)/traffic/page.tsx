import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TrafficOverviewTab } from "@/features/traffic/traffic-tab-views";
import { trafficQueries } from "@/lib/queries/traffic";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { resolveTrafficRange } from "@/lib/traffic-tabs";

export const metadata: Metadata = { title: "Store Traffic" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

/** Overview tab. Chrome (header/picker/tabs) lives in the TrafficShell layout; the data
 * streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: PageProps) {
  const range = resolveTrafficRange(await searchParams);
  const queryClient = getQueryClient();
  prefetch(queryClient, trafficQueries.overview(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrafficOverviewTab range={range} />
    </HydrationBoundary>
  );
}
