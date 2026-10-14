"use client";

import { useState } from "react";
import { ScrollText } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusDot } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/features/customer-support/skeletons";
import { EmptyNote } from "@/features/customer-support/support-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { inboxHref } from "@/lib/support-inbox";
import type { ActivityAction } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

const ACTION_LABELS: Record<ActivityAction, string> = {
  tag: "Tagged",
  assign: "Assigned",
  reply: "Replied",
  note: "Note",
  close: "Closed",
  snooze: "Snoozed",
  priority: "Priority",
  handoff: "Handed off",
  kill_switch: "Paused or resumed",
  setting: "Setting",
};

const PAGE = 20;

/**
 * Settings → Activity log (SPEC-346): every action taken in the helpdesk — by the agent, a
 * person or a helpdesk rule — with who, when, what changed and a link to the ticket. Newest
 * first, twenty a page.
 */
export function ActivityLog() {
  const [page, setPage] = useState(1);
  const activity = useApiQuery(customerSupportQueries.activity(page));
  if (activity.isPending) return <ListSkeleton rows={5} />;
  if (activity.isError) return <QueryErrorState error={activity.error} onRetry={() => void activity.refetch()} />;
  const { entries, total } = activity.data;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  if (entries.length === 0) {
    return (
      <EmptyNote icon={ScrollText} title="No activity yet">
        Every tag, reply, assignment and close the agent makes is recorded here.
      </EmptyNote>
    );
  }
  return (
    <div className="space-y-2">
      <ol className="divide-y divide-border rounded-xl border border-border">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
            <span className="pt-1.5">
              <StatusDot tone={entry.actor.kind === "agent" ? "ai" : "neutral"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{ACTION_LABELS[entry.action]}</span> · {entry.detail}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {entry.actor.name} · {formatDateTime(entry.at)}
                {entry.ticketId ? (
                  <>
                    {" · "}
                    <ShallowLink href={inboxHref({ ticket: entry.ticketId })} className="underline-offset-4 hover:text-foreground hover:underline">
                      {entry.ticketSubject ?? "Open the ticket"}
                    </ShallowLink>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {pages > 1 ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Button size="xs" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="tabular-nums">
            Page {page} of {pages}
          </span>
          <Button size="xs" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
