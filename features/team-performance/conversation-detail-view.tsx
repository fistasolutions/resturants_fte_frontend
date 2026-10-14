"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationThread } from "@/features/team-performance/conversation-thread";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import { gorgiasQueries } from "@/lib/queries/gorgias";

/** One Gorgias conversation (SPEC-087), read from the client cache (SPEC-230); a 404
 * is the route's not-found page, as before. */
export function ConversationDetailView({ ticketId, backHref }: { ticketId: number; backHref: string }) {
  const detail = useApiQuery(gorgiasQueries.conversation(ticketId));
  if (detail.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-96 rounded-card" />
      </main>
    );
  }
  if (detail.isError) {
    if (isNotFound(detail.error)) notFound();
    return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  }
  return (
    <main className="space-y-6 p-4 md:p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to conversations
      </Link>
      <ConversationThread detail={detail.data} />
    </main>
  );
}
