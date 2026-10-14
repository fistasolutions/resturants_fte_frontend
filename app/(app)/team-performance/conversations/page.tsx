import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TeamPerformanceConversationsTab } from "@/features/team-performance/tp-conversations-tab";
import { CONVERSATIONS_PAGE_SIZE } from "@/lib/page-sizes";
import { resolveDateRange } from "@/lib/date-range";
import { conversationsApiQuery, parseConversationFilters } from "@/lib/gorgias-filters";
import { withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { paramsQueryString } from "@/lib/params-query";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ConversationsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ConversationsPage({ searchParams }: ConversationsPageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withWorkspaceDefaultRange(params), todayISO());
  const filters = parseConversationFilters(params);
  const listQuery = conversationsApiQuery(filters, range.from, range.to, CONVERSATIONS_PAGE_SIZE, 0);
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.conversations(listQuery));
  prefetch(queryClient, gorgiasQueries.agents());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPerformanceConversationsTab
        range={range}
        filters={filters}
        queryString={paramsQueryString(params)}
      />
    </HydrationBoundary>
  );
}
