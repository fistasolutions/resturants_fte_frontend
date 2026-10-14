"use client";

import GorgiasLoading from "@/app/(app)/team-performance/loading";
import { ConversationsControls } from "@/features/team-performance/conversations-controls";
import { ConversationsPanel } from "@/features/team-performance/conversations-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { conversationsApiQuery, type ConversationFilters } from "@/lib/gorgias-filters";
import { gorgiasTabHref } from "@/lib/gorgias-tabs";
import { CONVERSATIONS_PAGE_SIZE } from "@/lib/page-sizes";
import { gorgiasQueries } from "@/lib/queries/gorgias";

/** Team Performance → Conversations, read from the client cache (SPEC-230). */
export function TeamPerformanceConversationsTab({
  range,
  filters,
  queryString,
}: {
  range: ResolvedRange;
  filters: ConversationFilters;
  queryString: string;
}) {
  const PAGE_SIZE = CONVERSATIONS_PAGE_SIZE;
  const listQuery = conversationsApiQuery(filters, range.from, range.to, PAGE_SIZE, 0);
  const exportQuery = conversationsApiQuery(filters, range.from, range.to);
  const listQ = useApiQuery(gorgiasQueries.conversations(listQuery));
  const agentsQ = useApiQuery(gorgiasQueries.agents());
  if (listQ.isPending || agentsQ.isPending) return <GorgiasLoading />;
  if (listQ.isError || agentsQ.isError) {
    return (
      <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Couldn&apos;t load conversations. Try again shortly.
      </div>
    );
  }
  const initial = listQ.data;
  const agents = agentsQ.data.agents;

  const query = new URLSearchParams(queryString);
  const returnTo = gorgiasTabHref("/team-performance/conversations", query);
  const exportHref = `/api/proxy/gorgias/conversations/export?${exportQuery}`;

  return (
    <div className="space-y-4">
      <ConversationsControls
        filters={filters}
        agents={agents}
        reasons={initial.reasons}
        exportHref={exportHref}
      />
      <ConversationsPanel
        key={listQuery}
        initial={initial}
        filters={filters}
        start={range.from}
        end={range.to}
        pageSize={PAGE_SIZE}
        returnTo={returnTo}
      />
    </div>
  );
}
