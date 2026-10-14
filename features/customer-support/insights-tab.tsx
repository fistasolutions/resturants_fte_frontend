"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Lightbulb } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { CardsSkeleton } from "@/features/customer-support/skeletons";
import { EmptyNote } from "@/features/customer-support/support-ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatMoney, supportHref } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import {
  INSIGHT_KINDS,
  filterInsights,
  insightCounts,
  insightKindLabel,
  normalizeInsightFilter,
  sortInsights,
  trendText,
} from "@/lib/support-insights";
import { cn } from "@/lib/utils";
import type { Insight } from "@/types/customer-support";

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <header className="space-y-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {insightKindLabel(insight.kind)} · {insight.owner}
        </p>
        <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
      </header>
      <p className="text-sm text-muted-foreground">{insight.detail}</p>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/40 p-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Tickets</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{insight.tickets}</p>
          <p className="text-[11px] text-muted-foreground">{trendText(insight.trend)}</p>
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">At stake</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{formatMoney(insight.money, true)}</p>
          <p className="text-[11px] text-muted-foreground">{insight.moneyBasis}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Link href={insight.sendTo.href} prefetch={false} className={buttonVariants({ size: "sm" })}>
          Send to {insight.sendTo.label} <ArrowUpRight aria-hidden />
        </Link>
        <Link href={insight.evidence.href} prefetch={false} className={buttonVariants({ size: "sm", variant: "ghost" })}>
          {insight.evidence.label}
        </Link>
      </div>
    </article>
  );
}

/**
 * Insights (SPEC-346): Voice of Customer turned into fixes — size charts, damage, late
 * locations, confusing policies, the products most written about — each with an owner, the
 * money at stake with its basis, and a link to the page where the fix is made. The money is
 * never summed: two insights can describe the same tickets.
 */
export function InsightsTab() {
  const params = useSearchParams();
  const filter = normalizeInsightFilter(params.get("kind"));
  const insights = useApiQuery(customerSupportQueries.insights());

  if (insights.isPending) return <CardsSkeleton count={4} height="h-64" />;
  if (insights.isError) return <QueryErrorState error={insights.error} onRetry={() => void insights.refetch()} />;

  const counts = insightCounts(insights.data);
  const shown = sortInsights(filterInsights(insights.data, filter));

  return (
    <div className="space-y-4">
      <nav aria-label="Kinds of insight" className="flex flex-wrap gap-1.5">
        {[{ key: "all" as const, label: "All" }, ...INSIGHT_KINDS].map((kind) => {
          const active = filter === kind.key;
          return (
            <ShallowLink
              key={kind.key}
              href={supportHref("insights", { kind: kind.key === "all" ? null : kind.key })}
              replace
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {kind.label}
              <span className="tabular-nums opacity-70">{counts[kind.key]}</span>
            </ShallowLink>
          );
        })}
      </nav>
      {shown.length === 0 ? (
        <EmptyNote icon={Lightbulb} title="Nothing recurring here this week">
          An insight appears once three or more tickets point at the same fix.
        </EmptyNote>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Every contact reason across the whole team is in{" "}
        <Link href="/team-performance/voice-of-customer" prefetch={false} className="font-medium text-primary underline-offset-4 hover:underline">
          Team Performance → Voice of Customer
        </Link>
        .
      </p>
    </div>
  );
}
