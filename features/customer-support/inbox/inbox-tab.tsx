"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { MousePointerClick } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ContextPanel } from "@/features/customer-support/inbox/context-panel";
import { ConversationPane } from "@/features/customer-support/inbox/conversation-pane";
import { QueueList } from "@/features/customer-support/inbox/queue-list";
import { InboxSkeleton } from "@/features/customer-support/skeletons";
import { ActionFeedback, EmptyNote } from "@/features/customer-support/support-ui";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { isEditableTarget } from "@/lib/chat-drawer-prompts";
import { clientApi } from "@/lib/client-api";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { inboxHref, inboxViewFrom, neighbour, type InboxSort } from "@/lib/support-inbox";
import { cn } from "@/lib/utils";

function TicketSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

/**
 * The live queue (SPEC-346): queue · conversation · context on a wide screen; the queue alone,
 * then the open ticket with a way back, on a phone. Every choice is in the URL — the queue, the
 * sort, the page and the open ticket — so a link opens exactly this view. j / k move through
 * the page's tickets without a request.
 *
 * SPEC-348: switching a queue, the sort or the page keeps everything on screen — the previous
 * page stays (dimmed) until the next arrives, so the tab is never swapped for a skeleton after
 * its first load, and the open conversation stays where it is. Opening another ticket keeps
 * the current one on screen, dimmed, until the next arrives; rows are prefetched on hover and
 * the open ticket's neighbours ahead of j / k.
 */
export function InboxTab() {
  const params = useSearchParams();
  const view = inboxViewFrom(new URLSearchParams(params.toString()));
  const actions = useSupportActions();
  const workspace = useApiQuery(customerSupportQueries.workspace());
  const page = useApiQuery(customerSupportQueries.inbox(view.queue, view.sort, view.page), {
    placeholderData: keepPreviousData,
  });
  const rows = useMemo(() => page.data?.tickets ?? [], [page.data]);
  const selectedId = view.ticket ?? rows[0]?.id ?? null;
  const ticket = useApiQuery(selectedId ? customerSupportQueries.ticket(selectedId) : null, {
    placeholderData: keepPreviousData,
  });
  const switching = ticket.isPlaceholderData;
  const queryClient = useQueryClient();

  // Warm the tickets either side of the open one, so j / k (and the next click) is instant.
  useEffect(() => {
    if (!selectedId || switching) return;
    for (const step of [1, -1] as const) {
      const id = neighbour(rows, selectedId, step);
      if (!id || id === selectedId) continue;
      const def = customerSupportQueries.ticket(id);
      void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
    }
  }, [queryClient, rows, selectedId, switching]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && isEditableTarget(target.tagName, target.isContentEditable)) return;
      if (event.key !== "j" && event.key !== "k") return;
      const next = neighbour(rows, selectedId, event.key === "j" ? 1 : -1);
      if (!next || next === selectedId) return;
      event.preventDefault();
      window.history.replaceState(null, "", inboxHref({ ...view, ticket: next }));
      document.querySelector<HTMLElement>(`[data-ticket-id="${next}"]`)?.scrollIntoView({ block: "nearest" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, selectedId, view]);

  if (page.isPending || workspace.isPending) return <InboxSkeleton />;
  if (page.isError) return <QueryErrorState error={page.error} onRetry={() => void page.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;

  const onSort = (sort: InboxSort) => window.history.pushState(null, "", inboxHref({ ...view, sort, page: 1 }));
  // On a phone the open ticket replaces the queue; it opens when the URL names one.
  const phoneShowsTicket = view.ticket !== null;

  return (
    <div className="space-y-3">
      <ActionFeedback
        notice={actions.notice}
        error={actions.error}
        onDismiss={() => {
          actions.clearError();
          actions.clearNotice();
        }}
      />
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)_20rem]">
        <div className={cn("min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100svh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-1 scrollbar-subtle", phoneShowsTicket && "hidden lg:block")}>
          <QueueList view={view} page={page.data} slas={workspace.data.slas} selectedId={selectedId} onSort={onSort} refreshing={page.isPlaceholderData} />
          <p className="mt-2 hidden text-[11px] text-muted-foreground lg:block">
            <kbd className="rounded border border-border px-1">j</kbd> / <kbd className="rounded border border-border px-1">k</kbd> to move
          </p>
        </div>
        <div className={cn("min-w-0", !phoneShowsTicket && "hidden lg:block")}>
          {selectedId === null ? (
            <EmptyNote icon={MousePointerClick} title="No ticket open">
              Pick a ticket from the queue.
            </EmptyNote>
          ) : ticket.isPending ? (
            <TicketSkeleton />
          ) : ticket.isError ? (
            <QueryErrorState error={ticket.error} onRetry={() => void ticket.refetch()} />
          ) : (
            <div className="relative" aria-busy={switching}>
              {switching ? (
                <div className="absolute inset-x-0 -top-2 h-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                </div>
              ) : null}
              <div className={cn("space-y-4 transition-opacity duration-150", switching && "pointer-events-none opacity-60")}>
                <ConversationPane key={ticket.data.ticket.id} detail={ticket.data} workspace={workspace.data} actions={actions} view={view} />
                <div className="xl:hidden">
                  <ContextPanel ticket={ticket.data.ticket} context={ticket.data.context} provider={workspace.data.provider} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hidden min-w-0 xl:block">
          {ticket.data ? (
            <div
              aria-busy={switching}
              className={cn(
                "transition-opacity duration-150 xl:sticky xl:top-4 xl:max-h-[calc(100svh-8rem)] xl:overflow-y-auto scrollbar-subtle",
                switching && "pointer-events-none opacity-60",
              )}
            >
              <ContextPanel ticket={ticket.data.ticket} context={ticket.data.context} provider={workspace.data.provider} />
            </div>
          ) : selectedId ? (
            <Skeleton className="h-96 rounded-2xl" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  );
}
