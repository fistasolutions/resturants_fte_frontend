"use client";

import { useState } from "react";
import { ChevronLeft, Ellipsis, UserRoundCheck } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HandoffDialog } from "@/features/customer-support/handoff-dialog";
import { OutsideActions } from "@/features/customer-support/inbox/outside-actions";
import { ReplyBox } from "@/features/customer-support/inbox/reply-box";
import { Thread } from "@/features/customer-support/inbox/thread";
import { ChannelMark } from "@/features/customer-support/support-ui";
import type { SupportActions } from "@/features/customer-support/use-support-actions";
import { useCan } from "@/hooks/use-can";
import {
  PRIORITIES,
  PRIORITY_META,
  QUEUE_LABELS,
  SENSITIVE_LABELS,
  SENTIMENT_META,
  SLA_META,
  slaClock,
  slaText,
  topicLabel,
} from "@/lib/customer-support";
import { can } from "@/lib/helpdesk-providers";
import { inboxHref, type InboxView } from "@/lib/support-inbox";
import { handOff, markOutsideDone, retrySend, updateTicket } from "@/services/customer-support-actions";
import type { Priority, SupportWorkspace, TicketDetail } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

function TicketMenu({ detail, workspace, actions }: { detail: TicketDetail; workspace: SupportWorkspace; actions: SupportActions }) {
  const { ticket } = detail;
  const id = ticket.id;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Ticket actions">
          <Ellipsis aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={ticket.priority}
          onValueChange={(value) => void actions.run("priority", () => updateTicket(id, { priority: value as Priority }))}
        >
          {PRIORITIES.map((p) => (
            <DropdownMenuRadioItem key={p} value={p}>
              {PRIORITY_META[p].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {can(workspace.provider, "snooze") && ticket.status === "open" ? (
          <>
            <DropdownMenuItem onSelect={() => void actions.run("snooze", () => updateTicket(id, { snoozeHours: 4 }))}>
              Snooze 4 hours
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void actions.run("snooze", () => updateTicket(id, { snoozeHours: 24 }))}>
              Snooze until tomorrow
            </DropdownMenuItem>
          </>
        ) : null}
        {ticket.status === "open" ? (
          <DropdownMenuItem onSelect={() => void actions.run("close", () => updateTicket(id, { close: true }))}>
            Close
          </DropdownMenuItem>
        ) : null}
        {ticket.queue !== "spam" ? (
          <DropdownMenuItem onSelect={() => void actions.run("spam", () => updateTicket(id, { spam: true }))}>
            Mark as spam
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The open ticket (SPEC-346): who wrote, about what, on which channel, its SLA clock and
 * queue; the thread; what was handed off and to whom; the actions prepared for a person; and
 * the reply box with the agent's draft.
 */
export function ConversationPane({
  detail,
  workspace,
  actions,
  view,
}: {
  detail: TicketDetail;
  workspace: SupportWorkspace;
  actions: SupportActions;
  view: InboxView;
}) {
  const { ticket } = detail;
  const [handingOff, setHandingOff] = useState(false);
  const roleCan = useCan();
  const manageGate = roleCan("team_performance.manage");
  const retryGate = roleCan(["messages.send", "team_performance.manage"]);
  const clock = ticket.status === "open" ? slaClock(ticket, workspace.slas, new Date()) : null;
  return (
    <article className="min-w-0 space-y-4" aria-label={`Ticket: ${ticket.subject}`}>
      <ShallowLink
        href={inboxHref({ ...view, ticket: null })}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:hidden"
      >
        <ChevronLeft className="size-3.5" aria-hidden /> Back to the queue
      </ShallowLink>
      <header className="space-y-2 border-b border-border pb-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground [overflow-wrap:anywhere]">{ticket.subject}</h2>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span className="text-foreground">{ticket.customer.name}</span>
              <ChannelMark channel={ticket.channel} label />
              <span>Opened {formatDateTime(ticket.createdAt)}</span>
              {ticket.externalId ? <span>#{ticket.externalId} in Gorgias</span> : null}
            </p>
          </div>
          <RoleGate need="team_performance.manage">
            <TicketMenu detail={detail} workspace={workspace} actions={actions} />
          </RoleGate>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge tone="neutral">{QUEUE_LABELS[ticket.queue]}</StatusBadge>
          <StatusBadge tone="info">{topicLabel(ticket.topic)}</StatusBadge>
          <StatusBadge tone={PRIORITY_META[ticket.priority].tone}>{PRIORITY_META[ticket.priority].label} priority</StatusBadge>
          {ticket.sentiment !== "calm" ? <StatusBadge tone={SENTIMENT_META[ticket.sentiment].tone}>{SENTIMENT_META[ticket.sentiment].label}</StatusBadge> : null}
          {ticket.flags.map((flag) => (
            <StatusBadge key={flag} tone="destructive">
              {SENSITIVE_LABELS[flag]}
            </StatusBadge>
          ))}
          {clock && ticket.queue !== "snoozed" ? <StatusBadge tone={SLA_META[clock.status].tone}>{slaText(clock)}</StatusBadge> : null}
          {ticket.snoozedUntil && ticket.queue === "snoozed" ? (
            <span className="text-xs text-muted-foreground">Snoozed until {formatDateTime(ticket.snoozedUntil)}</span>
          ) : null}
          {ticket.assignee ? <span className="text-xs text-muted-foreground">Assigned to {ticket.assignee.name}</span> : null}
        </div>
      </header>

      <Thread
        messages={detail.messages}
        busy={actions.busy !== null || !retryGate.allowed}
        roleReason={retryGate.allowed ? null : retryGate.reason}
        onRetry={(messageId) => void actions.run("retry", () => retrySend(messageId))}
      />

      {detail.handoff ? (
        <section className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3" aria-label="Hand-off">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <UserRoundCheck className="size-4" aria-hidden /> Handed to {detail.handoff.to.name} · {PRIORITY_META[detail.handoff.priority].label}
          </p>
          <ul className="space-y-0.5 text-sm text-foreground">
            {detail.handoff.summary.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">Next step: {detail.handoff.nextStep}</p>
          <p className="text-[11px] text-muted-foreground">Why: {detail.handoff.reason}</p>
        </section>
      ) : null}

      <OutsideActions
        actions={detail.outsideActions}
        busy={actions.busy !== null || !manageGate.allowed}
        roleReason={manageGate.allowed ? null : manageGate.reason}
        onDone={(actionId) => void actions.run("outside", () => markOutsideDone(actionId))}
      />

      <ReplyBox key={`${ticket.id}:${detail.draft?.id ?? "none"}`} detail={detail} workspace={workspace} actions={actions} onHandoff={() => setHandingOff(true)} />

      {handingOff && manageGate.allowed ? (
        <HandoffDialog
          open
          onOpenChange={setHandingOff}
          ticket={ticket}
          context={detail.context}
          draft={detail.draft}
          workspace={workspace}
          busy={actions.busy === "handoff"}
          onConfirm={(handoff) =>
            void actions
              .run("handoff", () => handOff(ticket.id, handoff))
              .then((ok) => ok && setHandingOff(false))
          }
        />
      ) : null}
    </article>
  );
}
