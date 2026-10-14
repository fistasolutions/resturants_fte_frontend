import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AgentDetailView } from "@/features/team-performance/agent-detail-view";
import { AGENT_CONVERSATIONS_PAGE_SIZE as AGENT_PAGE_SIZE } from "@/lib/page-sizes";
import { resolveDateRange } from "@/lib/date-range";
import { conversationsApiQuery, type ConversationFilters } from "@/lib/gorgias-filters";
import { isSafeGorgiasReturnPath, withWorkspaceDefaultRange } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AgentDetailPage({ params, searchParams }: AgentDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const agentId = Number.parseInt(id, 10);
  if (!Number.isFinite(agentId)) notFound();

  const range = resolveDateRange(withWorkspaceDefaultRange(sp), todayISO());
  const backHref =
    sp.returnTo && isSafeGorgiasReturnPath(sp.returnTo) ? sp.returnTo : "/team-performance/agents";
  const filters: ConversationFilters = { status: null, agentId, reason: null, q: "", page: 1 };
  const listQuery = conversationsApiQuery(filters, range.from, range.to, AGENT_PAGE_SIZE, 0);

  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.overview(range.from, range.to));
  prefetch(queryClient, gorgiasQueries.conversations(listQuery));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentDetailView agentId={agentId} range={range} backHref={backHref} />
    </HydrationBoundary>
  );
}
