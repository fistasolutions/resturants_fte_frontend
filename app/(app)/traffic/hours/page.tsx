import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PeakHoursTab } from "@/features/traffic/traffic-tab-views";
import { trafficQueries } from "@/lib/queries/traffic";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { resolveTrafficRange } from "@/lib/traffic-tabs";

export const metadata: Metadata = { title: "Peak Hours" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

/** Peak Hours tab. Chrome (header/picker/tabs) lives in the TrafficShell layout; the data
 * streams into the client cache (SPEC-230). */
export default async function Page({ searchParams }: PageProps) {
  const range = resolveTrafficRange(await searchParams);
  const queryClient = getQueryClient();
  prefetch(queryClient, trafficQueries.peakHours(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PeakHoursTab range={range} />
    </HydrationBoundary>
  );
}
