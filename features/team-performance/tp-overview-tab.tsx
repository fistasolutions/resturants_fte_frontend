"use client";

import Link from "next/link";
import { Headset } from "lucide-react";

import GorgiasLoading from "@/app/(app)/team-performance/loading";
import { LeaderboardTable } from "@/features/team-performance/leaderboard-table";
import { OverviewAlertsStrip } from "@/features/team-performance/overview-alerts-strip";
import { OverviewBreakdowns } from "@/features/team-performance/overview-breakdowns";
import { OverviewContactRate } from "@/features/team-performance/overview-contact-rate";
import { OverviewKpis } from "@/features/team-performance/overview-kpis";
import { OverviewRevenueAtRisk } from "@/features/team-performance/overview-revenue-at-risk";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { gorgiasTabHref } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";

function GorgiasEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Headset className="size-5" aria-hidden />
      </span>
      <h2 className="font-heading text-lg tracking-wide">No Gorgias data synced yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Once Gorgias is connected and the first sync completes, support metrics will appear here.
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

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
      {message}
    </div>
  );
}

/** Team Performance → Overview (SPEC-074), read from the client cache (SPEC-230). The
 * chrome is the persistent Gorgias shell; this is only the tab body. */
export function TeamPerformanceOverviewTab({ range, queryString }: { range: ResolvedRange; queryString: string }) {
  const result = useApiQuery(gorgiasQueries.overview(range.from, range.to));
  if (result.isPending) return <GorgiasLoading />;
  if (result.isError) return <ErrorCard message="Couldn't load support metrics. Try again shortly." />;
  const overview = result.data;
  const query = new URLSearchParams(queryString);

  if (overview.leaderboard.length === 0) {
    return <GorgiasEmptyState />;
  }

  const alertsHref = gorgiasTabHref("/team-performance/alerts", query);
  const returnTo = gorgiasTabHref("/team-performance", query);

  return (
    <div className="space-y-6">
      <OverviewKpis overview={overview} />
      <div className="grid gap-3 lg:grid-cols-2">
        <OverviewContactRate overview={overview} />
        <OverviewRevenueAtRisk
          total={overview.revenue_at_risk.total}
          customerCount={overview.revenue_at_risk.customer_count}
          alertsHref={alertsHref}
        />
      </div>
      <OverviewAlertsStrip counts={overview.alerts} alertsHref={alertsHref} />
      <OverviewBreakdowns
        reasons={overview.breakdowns.contact_reason}
        channels={overview.breakdowns.channel}
      />
      <section className="space-y-3">
        <h2 className="font-heading text-lg tracking-wide">Agent leaderboard</h2>
        <LeaderboardTable agents={overview.leaderboard} returnTo={returnTo} />
      </section>
    </div>
  );
}
