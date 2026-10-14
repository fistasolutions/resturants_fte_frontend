"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Hourglass, Inbox, Send, UserRoundCheck, CircleCheck } from "lucide-react";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { Panel, PanelRow, StatusDot } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { OverviewSkeleton } from "@/features/customer-support/skeletons";
import { EmptyNote } from "@/features/customer-support/support-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  agentShare,
  compareAgentHuman,
  comparisonText,
  formatMinutes,
  formatMoney,
  percent,
  supportHref,
  topicLabel,
} from "@/lib/customer-support";
import type { StripTile, StripTone } from "@/lib/kpi-strip";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { inboxHref } from "@/lib/support-inbox";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import type { SupportOverview } from "@/types/customer-support";
import { formatTime } from "@/utils/format";

/** A Panel row that moves within this page by `history.pushState` (SPEC-301) — no server
 * render and no viewport prefetch, unlike `PanelRow`'s `href`. */
function RowLink({
  href,
  leading,
  trailing,
  children,
}: {
  href: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ShallowLink
      href={href}
      className="flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {leading ? <span className="flex shrink-0">{leading}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
    </ShallowLink>
  );
}

function toneOf(better: "agent" | "human" | "even" | null): StripTone {
  if (better === "agent") return "good";
  if (better === "human") return "warn";
  return "neutral";
}

/** The money strip: the agent next to the team on every figure both have. */
function stripTiles(o: SupportOverview): StripTile[] {
  const frt = compareAgentHuman(o.firstResponseMinutes.agent, o.firstResponseMinutes.human, true);
  const res = compareAgentHuman(o.resolutionHours.agent, o.resolutionHours.human, true);
  const csat = compareAgentHuman(o.csat.agent, o.csat.human, false);
  const share = agentShare(o.resolved);
  return [
    { key: "tickets", label: "Tickets · 24h", value: String(o.tickets24h), delta: null, invertDelta: false, sub: `${o.tickets7d} in 7 days`, tone: "neutral" },
    {
      key: "share",
      label: "Resolved by agent",
      value: share === null ? "—" : percent(share),
      delta: null,
      invertDelta: false,
      sub: `${o.resolved.agent} agent · ${o.resolved.human} team · 7d`,
      tone: "neutral",
    },
    {
      key: "frt",
      label: "First response",
      value: o.firstResponseMinutes.agent === null ? "—" : formatMinutes(o.firstResponseMinutes.agent),
      delta: null,
      invertDelta: true,
      sub: `Team ${o.firstResponseMinutes.human === null ? "—" : formatMinutes(o.firstResponseMinutes.human)} · ${comparisonText(frt)}`,
      tone: toneOf(frt.better),
    },
    {
      key: "resolution",
      label: "Resolution",
      value: o.resolutionHours.agent === null ? "—" : formatMinutes(o.resolutionHours.agent * 60),
      delta: null,
      invertDelta: true,
      sub: `Team ${o.resolutionHours.human === null ? "—" : formatMinutes(o.resolutionHours.human * 60)} · ${comparisonText(res)}`,
      tone: toneOf(res.better),
    },
    {
      key: "csat",
      label: "CSAT",
      value: o.csat.agent === null ? "—" : o.csat.agent.toFixed(1),
      suffix: "/5",
      delta: null,
      invertDelta: false,
      sub: `Team ${o.csat.human === null ? "—" : o.csat.human.toFixed(1)} · ${comparisonText(csat)}`,
      tone: toneOf(csat.better),
    },
    {
      key: "risk",
      label: "Revenue at risk",
      value: formatMoney(o.revenueAtRisk.amount, true),
      delta: null,
      invertDelta: false,
      sub: `${o.revenueAtRisk.tickets} open tickets · customer lifetime value`,
      tone: o.revenueAtRisk.amount.amountMinor > 0 ? "warn" : "neutral",
      href: inboxHref({ queue: "needs_approval", sort: "risk" }),
    },
  ];
}

function NeedsYou({ o }: { o: SupportOverview }) {
  const rows = [
    { key: "approvals", label: "Replies waiting for approval", count: o.needsYou.approvals, href: supportHref("approvals"), icon: CircleCheck },
    { key: "handoffs", label: "Tickets handed to your team", count: o.needsYou.handoffs, href: inboxHref({ queue: "handed_off" }), icon: UserRoundCheck },
    { key: "sla", label: "Over their first-response SLA", count: o.needsYou.slaBreaches, href: inboxHref({ queue: "needs_approval", sort: "sla" }), icon: Hourglass },
    { key: "failed", label: "Replies that failed to send", count: o.needsYou.failedSends, href: inboxHref({ queue: "auto_answered", sort: "newest" }), icon: Send },
  ];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <Panel title="Needs you" count={total ? String(total) : undefined}>
      {total === 0 ? (
        <EmptyNote icon={CircleCheck} title="Nothing waits for you">
          The agent is inside its guardrails and every reply has gone.
        </EmptyNote>
      ) : (
        rows.map((row) => (
          <RowLink
            key={row.key}
            href={row.href}
            leading={<row.icon className={cn("size-4", row.count > 0 ? "text-foreground" : "text-muted-foreground")} aria-hidden />}
            trailing={
              <span className={cn("text-sm font-semibold tabular-nums", row.count > 0 ? "text-foreground" : "text-muted-foreground")}>
                {row.count}
              </span>
            }
          >
            <span className={cn("text-sm", row.count > 0 ? "text-foreground" : "text-muted-foreground")}>{row.label}</span>
          </RowLink>
        ))
      )}
    </Panel>
  );
}

function TrendArrow({ trend }: { trend: number | null }) {
  if (trend === null) return <span className="text-xs text-muted-foreground">new</span>;
  if (Math.abs(trend) < 1) return <span className="text-xs text-muted-foreground">flat</span>;
  const up = trend > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  // More tickets is worse news: a rise reads as a warning.
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", up ? "text-warning" : "text-success")}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? "up" : "down"}</span>
      {Math.abs(Math.round(trend))}%
    </span>
  );
}

function WhyWriting({ o }: { o: SupportOverview }) {
  return (
    <Panel title="Why customers are writing" count="7 days" aside={<span>vs the 7 days before</span>}>
      {o.topics.length === 0 ? (
        <EmptyNote icon={Inbox} title="No tickets this week">
          Topics appear here as soon as customers write in.
        </EmptyNote>
      ) : (
        o.topics.map((topic) => (
          <RowLink key={topic.key} href={supportHref("insights")} trailing={<TrendArrow trend={topic.trend} />}>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-foreground">{topicLabel(topic.key)}</span>
              <span className="tabular-nums text-muted-foreground">{topic.tickets}</span>
            </span>
          </RowLink>
        ))
      )}
    </Panel>
  );
}

function Recent({ o, now }: { o: SupportOverview; now: Date }) {
  return (
    <Panel title="What the agent did last" aside={<ShallowLink href={supportHref("settings", { section: "activity" })} className="hover:text-foreground">Full log <ArrowRight className="inline size-3" aria-hidden /></ShallowLink>}>
      {o.recent.length === 0 ? (
        <EmptyNote icon={Inbox} title="Nothing yet">
          Its first actions appear here.
        </EmptyNote>
      ) : (
        o.recent.map((entry) => {
          const body = (
            <>
              <p className="text-sm text-foreground">{entry.detail}</p>
              {entry.ticketSubject ? <p className="truncate text-xs text-muted-foreground">{entry.ticketSubject}</p> : null}
            </>
          );
          const leading = <StatusDot tone={entry.actor.kind === "agent" ? "ai" : "neutral"} />;
          const trailing = <span className="text-xs text-muted-foreground">{relativeTime(entry.at, now)}</span>;
          return entry.ticketId ? (
            <RowLink key={entry.id} href={inboxHref({ ticket: entry.ticketId })} leading={leading} trailing={trailing}>
              {body}
            </RowLink>
          ) : (
            <PanelRow key={entry.id} leading={leading} trailing={trailing}>
              {body}
            </PanelRow>
          );
        })
      )}
    </Panel>
  );
}

/** Overview (SPEC-346): the shift at a glance — what customers write about, what the agent
 * handled, and what needs the owner, in ten seconds. */
export function OverviewTab() {
  const overview = useApiQuery(customerSupportQueries.overview());
  if (overview.isPending) return <OverviewSkeleton />;
  if (overview.isError) return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  const o = overview.data;
  const now = new Date();
  return (
    <div className="space-y-4">
      <KpiStrip tiles={stripTiles(o)} label="Support at a glance" explain={false} />
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">≈ {o.hoursSaved.hours} hours saved this week.</span> Basis: {o.hoursSaved.basis}{" "}
        Figures as of {formatTime(o.snapshotAt)}.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <NeedsYou o={o} />
        <WhyWriting o={o} />
      </div>
      <Recent o={o} now={now} />
    </div>
  );
}
