"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Crown, Inbox } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChannelMark, EmptyNote } from "@/features/customer-support/support-ui";
import { clientApi } from "@/lib/client-api";
import { PRIORITY_META, QUEUE_LABELS, QUEUE_ORDER, SLA_META, formatMoney, slaClock, slaText, topicLabel } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { INBOX_PAGE_SIZE, INBOX_SORTS, inboxHref, type InboxSort, type InboxView } from "@/lib/support-inbox";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import type { ChannelSla, InboxPage, QueueKey, SupportTicket } from "@/types/customer-support";

/**
 * The seven queues as tags that wrap (SPEC-348) — every one visible in the narrow column, none
 * cut off. A switch only moves the URL (`ShallowLink`); hovering or focusing a tag warms that
 * queue's first page, so the list usually changes without a wait. The open conversation stays.
 */
function QueueFilters({ view, counts }: { view: InboxView; counts: InboxPage["counts"] }) {
  const queryClient = useQueryClient();
  function warm(queue: QueueKey) {
    const def = customerSupportQueries.inbox(queue, view.sort, 1);
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  }
  return (
    <nav aria-label="Queues" className="flex flex-wrap gap-1.5">
      {QUEUE_ORDER.map((queue: QueueKey) => {
        const active = queue === view.queue;
        return (
          <ShallowLink
            key={queue}
            href={inboxHref({ queue, sort: view.sort, ticket: view.ticket })}
            aria-current={active ? "page" : undefined}
            onMouseEnter={() => warm(queue)}
            onFocus={() => warm(queue)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs leading-none whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {QUEUE_LABELS[queue]}
            <span
              className={cn(
                "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums",
                active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {counts[queue]}
            </span>
          </ShallowLink>
        );
      })}
    </nav>
  );
}

function TicketRow({
  ticket,
  selected,
  href,
  slas,
  now,
  onWarm,
}: {
  ticket: SupportTicket;
  selected: boolean;
  href: string;
  slas: ChannelSla[];
  now: Date;
  /** Load this ticket ahead of the click (SPEC-348 §6). */
  onWarm: () => void;
}) {
  const clock = ticket.status === "open" && ticket.queue !== "snoozed" ? slaClock(ticket, slas, now) : null;
  const showSla = clock && (clock.status === "breached" || clock.status === "due_soon");
  return (
    <li>
      <ShallowLink
        href={href}
        replace
        aria-current={selected ? "true" : undefined}
        data-ticket-id={ticket.id}
        onMouseEnter={onWarm}
        onFocus={onWarm}
        className={cn(
          "block rounded-xl border px-3 py-2.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "border-foreground/40 bg-muted" : "border-transparent hover:bg-muted/60",
        )}
      >
        <div className="flex items-center gap-2">
          <ChannelMark channel={ticket.channel} />
          <span className={cn("min-w-0 flex-1 truncate text-sm", ticket.unread ? "font-semibold text-foreground" : "text-foreground")}>
            {ticket.customer.name}
          </span>
          {ticket.customer.vip ? <Crown className="size-3.5 shrink-0 text-warning" aria-label="VIP" /> : null}
          <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(ticket.updatedAt, now)}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground">{ticket.subject}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{topicLabel(ticket.topic)}</span>
          {ticket.priority === "critical" || ticket.priority === "high" ? (
            <StatusBadge tone={PRIORITY_META[ticket.priority].tone}>{PRIORITY_META[ticket.priority].label}</StatusBadge>
          ) : null}
          {showSla && clock ? <StatusBadge tone={SLA_META[clock.status].tone}>{slaText(clock)}</StatusBadge> : null}
          {ticket.atRisk ? (
            <span className="ml-auto font-medium tabular-nums text-foreground" title="Customer lifetime value at risk">
              {formatMoney(ticket.atRisk.amount, true)}
            </span>
          ) : null}
        </div>
      </ShallowLink>
    </li>
  );
}

/**
 * The queue (SPEC-346): the seven queues with their counts, the sort, and a page of tickets.
 * A ticket is a link that replaces the URL's `ticket`, so back leaves the Inbox rather than
 * walking every ticket opened.
 */
export function QueueList({
  view,
  page,
  slas,
  selectedId,
  onSort,
  refreshing = false,
}: {
  view: InboxView;
  page: InboxPage;
  slas: ChannelSla[];
  selectedId: string | null;
  onSort: (sort: InboxSort) => void;
  /** The previous page is on screen while the next one loads (SPEC-348). */
  refreshing?: boolean;
}) {
  const now = new Date();
  const pages = Math.max(1, Math.ceil(page.total / INBOX_PAGE_SIZE));
  const queryClient = useQueryClient();
  const warmTicket = (id: string) => {
    const def = customerSupportQueries.ticket(id);
    void queryClient.prefetchQuery({ queryKey: def.queryKey, queryFn: () => def.load(clientApi) });
  };
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <QueueFilters view={view} counts={page.counts} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {page.total} {page.total === 1 ? "ticket" : "tickets"}
        </p>
        <Select value={view.sort} onValueChange={(value) => onSort(value as InboxSort)}>
          <SelectTrigger className="h-8 w-44 text-xs" aria-label="Sort the queue">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INBOX_SORTS.map((sort) => (
              <SelectItem key={sort.key} value={sort.key}>
                Sort: {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div aria-busy={refreshing} className={cn("min-w-0 transition-opacity duration-150", refreshing && "pointer-events-none opacity-60")}>
      {page.tickets.length === 0 ? (
        <EmptyNote icon={Inbox} title={`Nothing in ${QUEUE_LABELS[view.queue]}`}>
          {view.queue === "needs_approval" ? "Every reply has been decided. New drafts land here." : "Pick another queue above."}
        </EmptyNote>
      ) : (
        <ol className="space-y-1" aria-label={`${QUEUE_LABELS[view.queue]} tickets`}>
          {page.tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              selected={ticket.id === selectedId}
              href={inboxHref({ ...view, ticket: ticket.id })}
              slas={slas}
              now={now}
              onWarm={() => warmTicket(ticket.id)}
            />
          ))}
        </ol>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          {view.page > 1 ? (
            <ShallowLink href={inboxHref({ ...view, page: view.page - 1 })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
              <ChevronLeft className="size-3.5" aria-hidden /> Previous
            </ShallowLink>
          ) : (
            <span />
          )}
          <span className="tabular-nums">
            Page {view.page} of {pages}
          </span>
          {view.page < pages ? (
            <ShallowLink href={inboxHref({ ...view, page: view.page + 1 })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
              Next <ChevronRight className="size-3.5" aria-hidden />
            </ShallowLink>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
      </div>
    </div>
  );
}
