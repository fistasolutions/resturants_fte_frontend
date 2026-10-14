"use client";

import { ArrowRight, CalendarDays, Hammer } from "lucide-react";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { Panel, PanelRow, StatusDot, type DotTone } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { ActivityList } from "@/features/email-marketing/activity-list";
import { EmLink } from "@/features/email-marketing/em-link";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { emailTabHref, formatMoney, overviewTiles } from "@/lib/email-marketing";
import { providerInfo } from "@/lib/email-providers";
import { parseIsoDate, REASON_LABELS } from "@/lib/email-plan";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import type { NeedsYouItem } from "@/types/email-marketing";

const NEED_DOT: Record<NeedsYouItem["tone"], DotTone> = { warning: "warn", destructive: "error", info: "neutral" };

/** The morning view (SPEC-345): what email caused, what needs the owner, the money left on
 * the table, this week's plan, and the last five things the employee did. */
export function OverviewTab() {
  const overview = useApiQuery(emailMarketingQueries.overview());
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  if (overview.isPending || workspace.isPending) return <TabSkeleton />;
  if (overview.isError) return <QueryErrorState error={overview.error} onRetry={() => void overview.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  const data = overview.data;
  const provider = providerInfo(workspace.data.connection.provider);
  const now = new Date();
  const gapTotal = data.gaps.reduce((sum, gap) => sum + gap.monthly.amount, 0);

  return (
    <div className="space-y-4">
      <KpiStrip tiles={overviewTiles(data.strip, provider.name)} label="Email at a glance, last 30 days" explain={false} />
      <p className="text-xs text-muted-foreground">
        &ldquo;Sales email caused&rdquo; comes from holdout groups that did not get the email — the part {provider.name}&rsquo;s attributed
        revenue would have earned anyway is left out. Profit takes off product cost, discounts and sending cost.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Needs you" count={data.needsYou.length > 0 ? String(data.needsYou.length) : undefined}>
          {data.needsYou.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing is waiting for you.</p>
          ) : (
            data.needsYou.map((item) => (
              <EmLink
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="flex pt-1.5">
                  <StatusDot tone={NEED_DOT[item.tone]} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">{item.detail}</span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </EmLink>
            ))
          )}
        </Panel>

        <Panel title="Money left on the table" aside={gapTotal > 0 ? <span className="font-semibold text-foreground">≈ {formatMoney({ amount: gapTotal, currency: data.strip.profit30d.currency }, true)}/mo profit</span> : undefined}>
          {data.gaps.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Every lifecycle flow is built and healthy.</p>
          ) : (
            data.gaps.slice(0, 5).map((gap) => (
              <PanelRow
                key={gap.flowKey}
                trailing={
                  <EmLink href={`/email-marketing/flows/${encodeURIComponent(gap.flowId)}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    <Hammer aria-hidden />
                    Build it
                  </EmLink>
                }
              >
                <p className="text-sm font-medium text-foreground">
                  {gap.title} <span className="font-normal text-muted-foreground">· est. {formatMoney(gap.monthly)}/mo</span>
                </p>
                <p className="text-xs text-muted-foreground">{gap.why}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">Priced as {gap.basis}.</p>
              </PanelRow>
            ))
          )}
        </Panel>

        <Panel
          title="This week"
          aside={
            <EmLink href={emailTabHref("plan")} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              Open the plan
            </EmLink>
          }
        >
          {data.week.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Nothing planned this week. Ask the employee for a plan in Chat.</p>
          ) : (
            data.week.map((slot) => (
              <PanelRow
                key={slot.id}
                leading={<CalendarDays className="size-4 text-muted-foreground" aria-hidden />}
                trailing={
                  <StatusBadge tone={slot.state === "accepted" ? "success" : "neutral"}>{slot.state === "accepted" ? "Accepted" : "Proposed"}</StatusBadge>
                }
              >
                <p className="text-sm font-medium text-foreground">{slot.title}</p>
                <p className="text-xs text-muted-foreground">
                  {parseIsoDate(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {REASON_LABELS[slot.reasonKind]} · {slot.audience} · ≈{" "}
                  {formatMoney(slot.expectedProfit)} profit
                </p>
              </PanelRow>
            ))
          )}
        </Panel>

        <Panel
          title="What it did last"
          aside={
            <EmLink href={emailTabHref("settings")} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              Full activity
            </EmLink>
          }
        >
          <ActivityList entries={data.recent} now={now} />
        </Panel>
      </div>
    </div>
  );
}
