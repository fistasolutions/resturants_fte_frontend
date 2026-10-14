import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ConversationDetailView } from "@/features/team-performance/conversation-detail-view";
import { isSafeGorgiasReturnPath } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

interface ConversationDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function ConversationDetailPage({
  params,
  searchParams,
}: ConversationDetailPageProps) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const ticketId = Number.parseInt(id, 10);
  if (!Number.isFinite(ticketId)) notFound();

  const backHref =
    returnTo && isSafeGorgiasReturnPath(returnTo) ? returnTo : "/team-performance/conversations";
  const queryClient = getQueryClient();
  prefetch(queryClient, gorgiasQueries.conversation(ticketId));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConversationDetailView ticketId={ticketId} backHref={backHref} />
    </HydrationBoundary>
  );
}
