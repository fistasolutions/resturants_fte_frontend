import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TeamPerformanceAgentsTab } from "@/features/team-performance/tp-agents-tab";
import { resolveDateRange } from "@/lib/date-range";
import { withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { paramsQueryString } from "@/lib/params-query";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AgentsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withWorkspaceDefaultRange(params), todayISO());
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.overview(range.from, range.to));
  prefetch(queryClient, gorgiasQueries.agents());
  prefetch(queryClient, gorgiasQueries.supportAttention());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPerformanceAgentsTab range={range} queryString={paramsQueryString(params)} />
    </HydrationBoundary>
  );
}
