"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckList, EmptyNote, SourceChips } from "@/features/customer-support/support-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { CONFIDENCE_META, confidenceBand, guardrailCheck, percent } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import type { SupportTicket, SupportWorkspace, TopicKey } from "@/types/customer-support";
import { MessageBody } from "@/features/customer-support/message-body";

/**
 * The test bench (SPEC-346): pick a real past ticket on this topic and read the reply the
 * agent would write today, with today's playbook and data, next to what was sent back then.
 * Nothing is sent.
 */
export function TestBench({
  topic,
  tickets,
  workspace,
}: {
  topic: TopicKey;
  tickets: { id: string; subject: string }[];
  workspace: SupportWorkspace;
}) {
  const [ticketId, setTicketId] = useState<string | null>(tickets[0]?.id ?? null);
  const bench = useApiQuery(ticketId ? customerSupportQueries.bench(topic, ticketId) : null);
  const detail = useApiQuery(ticketId ? customerSupportQueries.ticket(ticketId) : null);

  if (tickets.length === 0) {
    return (
      <EmptyNote icon={FlaskConical} title="No past tickets on this topic yet">
        The bench replays closed tickets; it fills as this topic’s tickets close.
      </EmptyNote>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`bench-${topic}`} className="text-sm font-medium">
          Replay a past ticket
        </label>
        <Select value={ticketId ?? undefined} onValueChange={setTicketId}>
          <SelectTrigger id={`bench-${topic}`} className="w-full">
            <SelectValue placeholder="Pick a ticket" />
          </SelectTrigger>
          <SelectContent>
            {tickets.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {bench.isPending ? (
        <Skeleton className="h-48 rounded-xl" aria-hidden />
      ) : bench.isError ? (
        <QueryErrorState error={bench.error} onRetry={() => void bench.refetch()} />
      ) : (
        <div className="space-y-3">
          <blockquote className="min-w-0 rounded-xl border-l-2 border-border bg-muted/40 px-3 py-2">
            <MessageBody body={bench.data.customerMessage} />
          </blockquote>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">The agent today</p>
              <MessageBody body={bench.data.draft.body} className="rounded-xl border border-ai/30 bg-ai/5 px-3 py-2" />
              <p className="text-xs text-muted-foreground">
                {CONFIDENCE_META[confidenceBand(bench.data.draft.confidence)].label} · {percent(bench.data.draft.confidence)} · voice {bench.data.draft.voiceScore}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Sent back then</p>
              {bench.data.sentThen ? (
                <MessageBody body={bench.data.sentThen} className="rounded-xl border border-border bg-card px-3 py-2" />
              ) : (
                <p className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">Nothing was sent.</p>
              )}
            </div>
          </div>
          <SourceChips sources={bench.data.draft.sources} />
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {bench.data.draft.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {detail.data ? (
            <CheckList
              compact
              checks={guardrailCheck({
                ticket: { ...(detail.data.ticket as SupportTicket), agentReplies: 0, status: "open" },
                draft: bench.data.draft,
                guardrails: workspace.guardrails,
                killSwitch: false,
              })}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
