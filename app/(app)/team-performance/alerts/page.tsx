import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TeamPerformanceAlertsTab } from "@/features/team-performance/tp-alerts-tab";
import { resolveDateRange } from "@/lib/date-range";
import { withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { paramsQueryString } from "@/lib/params-query";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AlertsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withWorkspaceDefaultRange(params), todayISO());
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.alerts(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPerformanceAlertsTab range={range} queryString={paramsQueryString(params)} />
    </HydrationBoundary>
  );
}
