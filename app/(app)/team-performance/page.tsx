import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TeamPerformanceOverviewTab } from "@/features/team-performance/tp-overview-tab";
import { resolveDateRange } from "@/lib/date-range";
import { withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { paramsQueryString } from "@/lib/params-query";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface OverviewPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function TeamPerformanceOverviewPage({ searchParams }: OverviewPageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withWorkspaceDefaultRange(params), todayISO());
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.overview(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPerformanceOverviewTab range={range} queryString={paramsQueryString(params)} />
    </HydrationBoundary>
  );
}
