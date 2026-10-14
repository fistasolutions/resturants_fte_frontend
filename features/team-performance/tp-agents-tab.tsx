"use client";

import { Headset } from "lucide-react";
import Link from "next/link";

import GorgiasLoading from "@/app/(app)/team-performance/loading";
import { AgentPodium } from "@/features/team-performance/agent-podium";
import { AutomationStrip } from "@/features/team-performance/automation-strip";
import { PaginatedLeaderboard } from "@/features/team-performance/paginated-leaderboard";
import { SupportAttentionCard } from "@/features/team-performance/support-attention";
import { UnmappedAgentsBanner } from "@/features/team-performance/unmapped-agents-banner";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { gorgiasTabHref } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";

/** Team Performance → Agents (SPEC-094), read from the client cache (SPEC-230). */
export function TeamPerformanceAgentsTab({ range, queryString }: { range: ResolvedRange; queryString: string }) {
  const overviewQ = useApiQuery(gorgiasQueries.overview(range.from, range.to));
  const agentsQ = useApiQuery(gorgiasQueries.agents());
  const attentionQ = useApiQuery(gorgiasQueries.supportAttention());
  if (overviewQ.isPending || agentsQ.isPending || attentionQ.isPending) return <GorgiasLoading />;
  if (overviewQ.isError || agentsQ.isError || attentionQ.isError) {
    return (
      <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Couldn&apos;t load agent metrics. Try again shortly.
      </div>
    );
  }
  const overview = overviewQ.data;
  const unmapped = agentsQ.data.agents.filter((a) => !a.mapped);
  const attention = attentionQ.data;

  if (overview.leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Headset className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg tracking-wide">No Gorgias data synced yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Once Gorgias is connected and the first sync completes, agents will appear here.
        </p>
        <Link
          href="/integrations"
          className="mt-4 text-sm font-medium text-foreground underline underline-offset-4"
        >
          Check the connection in Integrations
        </Link>
      </div>
    );
  }

  const query = new URLSearchParams(queryString);
  const returnTo = gorgiasTabHref("/team-performance/agents", query);

  // Backend ranks the leaderboard by resolved volume (desc) and flags bots.
  // Humans take the podium (top 3) + the paginated table (rank 4+); bots are
  // pooled into the automation strip, never ranked against people (SPEC-094).
  const humans = overview.leaderboard.filter((a) => !a.is_bot);
  const bots = overview.leaderboard.filter((a) => a.is_bot);

  return (
    <div className="space-y-4">
      <UnmappedAgentsBanner agents={unmapped} />
      <SupportAttentionCard agents={attention.agents} />
      <section className="space-y-4">
        <h2 className="font-heading text-lg tracking-wide">Agent leaderboard</h2>
        <AgentPodium agents={humans} returnTo={returnTo} />
        <PaginatedLeaderboard agents={humans.slice(3)} startRank={4} returnTo={returnTo} />
      </section>
      <AutomationStrip bots={bots} />
    </div>
  );
}
