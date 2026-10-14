"use client";

import { AlertTriangle, CheckCircle2, Clock, Frown, MailQuestion, ShieldAlert } from "lucide-react";

import GorgiasLoading from "@/app/(app)/team-performance/loading";
import { ConversationsTable } from "@/features/team-performance/conversations-table";
import { RevenueAtRiskTable } from "@/features/team-performance/revenue-at-risk-table";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { gorgiasTabHref } from "@/lib/gorgias-tabs";
import { gorgiasQueries } from "@/lib/queries/gorgias";
import type { GorgiasConversation, GorgiasRevenueAtRisk } from "@/types/gorgias";
import { formatCurrency, formatNumber } from "@/utils/format";

type Tone = "destructive" | "warning";

function AlertSection({
  title,
  description,
  icon: Icon,
  tone,
  count,
  conversations,
  returnTo,
}: {
  title: string;
  description: string;
  icon: typeof AlertTriangle;
  tone: Tone;
  count: number;
  conversations: GorgiasConversation[];
  returnTo: string;
}) {
  const toneText = tone === "destructive" ? "text-destructive" : "text-warning";
  const toneBg =
    tone === "destructive"
      ? "bg-destructive/10 ring-destructive/20"
      : "bg-warning/10 ring-warning/20";
  return (
    <section className="space-y-3">
      <div className={`flex items-center gap-3 rounded-card p-3 ring-1 ${toneBg}`}>
        <Icon className={`size-5 ${toneText}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className={`font-heading text-xl tracking-wide tabular-nums ${toneText}`}>
          {formatNumber(count)}
        </span>
      </div>
      {conversations.length === 0 ? (
        <div className="flex items-center gap-2 rounded-card bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          Nothing here — all clear.
        </div>
      ) : (
        <ConversationsTable conversations={conversations} returnTo={returnTo} />
      )}
    </section>
  );
}

function RevenueAtRiskSection({
  data,
  returnTo,
}: {
  data: GorgiasRevenueAtRisk;
  returnTo: string;
}) {
  const active = data.total > 0;
  return (
    <section className="space-y-3">
      <div
        className={`flex items-center gap-3 rounded-card p-3 ring-1 ${
          active ? "bg-warning/10 ring-warning/20" : "bg-card ring-foreground/10"
        }`}
      >
        <ShieldAlert
          className={`size-5 ${active ? "text-warning" : "text-muted-foreground"}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Revenue at risk</h2>
          <p className="text-xs text-muted-foreground">
            Lifetime value of {formatNumber(data.customer_count)} customer
            {data.customer_count === 1 ? "" : "s"} with an open or unhappy conversation right now —
            an association, not predicted lost revenue.
          </p>
        </div>
        <span
          className={`font-heading text-xl tracking-wide tabular-nums ${
            active ? "text-warning" : "text-foreground"
          }`}
        >
          {formatCurrency(data.total)}
        </span>
      </div>
      {data.customers.length === 0 ? (
        <div className="flex items-center gap-2 rounded-card bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
          <CheckCircle2 className="size-4 text-success" aria-hidden />
          No high-value customers waiting — all clear.
        </div>
      ) : (
        <RevenueAtRiskTable customers={data.customers} returnTo={returnTo} />
      )}
    </section>
  );
}

/** Team Performance → Alerts, read from the client cache (SPEC-230). */
export function TeamPerformanceAlertsTab({ range, queryString }: { range: ResolvedRange; queryString: string }) {
  const result = useApiQuery(gorgiasQueries.alerts(range.from, range.to));
  if (result.isPending) return <GorgiasLoading />;
  if (result.isError) {
    return (
      <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        Couldn&apos;t load alerts. Try again shortly.
      </div>
    );
  }
  const alerts = result.data;

  const query = new URLSearchParams(queryString);
  const returnTo = gorgiasTabHref("/team-performance/alerts", query);

  return (
    <div className="space-y-6">
      <RevenueAtRiskSection data={alerts.revenue_at_risk} returnTo={returnTo} />
      <AlertSection
        title="Unanswered"
        description="Open conversations with no agent reply yet."
        icon={MailQuestion}
        tone="destructive"
        count={alerts.counts.unanswered}
        conversations={alerts.unanswered}
        returnTo={returnTo}
      />
      <AlertSection
        title="Open more than 24 hours"
        description="Still open and first created over 24 hours ago."
        icon={Clock}
        tone="warning"
        count={alerts.counts.over_24h}
        conversations={alerts.over_24h}
        returnTo={returnTo}
      />
      <AlertSection
        title="Unhappy customers"
        description="Satisfaction score of 3 or below."
        icon={Frown}
        tone="destructive"
        count={alerts.counts.unhappy}
        conversations={alerts.unhappy}
        returnTo={returnTo}
      />
      <AlertSection
        title="Reopened"
        description="Conversations reopened after being closed."
        icon={AlertTriangle}
        tone="warning"
        count={alerts.counts.reopened}
        conversations={alerts.reopened}
        returnTo={returnTo}
      />
    </div>
  );
}
