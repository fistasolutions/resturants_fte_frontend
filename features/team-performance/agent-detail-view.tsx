"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ConversationsPanel } from "@/features/team-performance/conversations-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { formatDuration } from "@/lib/format-duration";
import { conversationsApiQuery, type ConversationFilters } from "@/lib/gorgias-filters";
import { AGENT_CONVERSATIONS_PAGE_SIZE as AGENT_PAGE_SIZE } from "@/lib/page-sizes";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import { formatNumber } from "@/utils/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl tracking-wide tabular-nums">{value}</p>
    </div>
  );
}

/** One agent (SPEC-094), read from the client cache (SPEC-230). The overview answer is
 * the same one the Agents tab already holds, so the header is instant on the way in. */
export function AgentDetailView({ agentId, range, backHref }: { agentId: number; range: ResolvedRange; backHref: string }) {
  const PAGE_SIZE = AGENT_PAGE_SIZE;
  const filters: ConversationFilters = {
    status: null,
    agentId,
    reason: null,
    q: "",
    page: 1,
  };
  const listQuery = conversationsApiQuery(filters, range.from, range.to, PAGE_SIZE, 0);
  const overviewQ = useApiQuery(gorgiasQueries.overview(range.from, range.to));
  const conversationsQ = useApiQuery(gorgiasQueries.conversations(listQuery));

  if (overviewQ.isPending || conversationsQ.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-card" />
      </main>
    );
  }
  if (overviewQ.isError || conversationsQ.isError) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load this agent. Try again shortly.
        </div>
      </main>
    );
  }
  const overview = overviewQ.data;
  const conversations = conversationsQ.data;

  const agent = overview.leaderboard.find((a) => a.gorgias_agent_id === agentId);
  if (!agent) notFound();

  const returnTo = `/team-performance/agents/${agentId}`;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back
      </Link>

      <div>
        <h1 className="font-heading text-2xl tracking-wide">{agent.staff_name ?? agent.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {agent.mapped ? agent.name : `${agent.name} · unmapped`} · {range.label}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Answered" value={formatNumber(agent.tickets_answered)} />
        <Stat label="Resolved" value={formatNumber(agent.tickets_resolved)} />
        <Stat label="Avg 1st response" value={formatDuration(agent.avg_first_response_seconds)} />
        <Stat label="Avg resolution" value={formatDuration(agent.avg_resolution_seconds)} />
        <Stat label="CSAT" value={agent.csat === null ? "—" : agent.csat.toFixed(2)} />
        <Stat label="Open (EOD)" value={formatNumber(agent.open_backlog_eod)} />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg tracking-wide">Conversations</h2>
        <ConversationsPanel
          key={listQuery}
          initial={conversations}
          filters={filters}
          start={range.from}
          end={range.to}
          pageSize={PAGE_SIZE}
          returnTo={returnTo}
        />
      </section>
    </main>
  );
}
