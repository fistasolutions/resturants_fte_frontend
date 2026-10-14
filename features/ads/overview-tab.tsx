import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  Sliders,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityKind, OverviewData, TrendPoint } from "@/types/ads";
import type { ClarityCampaigns } from "@/types/clarity";

import { SourceBehaviourCard } from "./source-behaviour-card";
import { formatCurrency, formatTime } from "@/utils/format";

import { KpiTile } from "./kpi-tile";
import { ChannelBadge, ReasonChip } from "./ads-pills";

const ACTIVITY_ICON: Record<ActivityKind, typeof Rocket> = {
  launch: Rocket,
  approval: ThumbsUp,
  optimize: Sliders,
  guardrail: ShieldCheck,
  measure: TrendingUp,
};

function BlendedTrendCard({ trend }: { trend: TrendPoint[] }) {
  const max = Math.max(...trend.map((p) => Math.max(p.spend, p.profit)));
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Spend vs profit</CardTitle>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden />
            Attributed profit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted-foreground/40" aria-hidden />
            Ad spend
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex h-44 items-end gap-3">
          {trend.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t-md bg-muted-foreground/40"
                  style={{ height: `${Math.round((point.spend / max) * 100)}%` }}
                  title={`${point.label} spend: ${formatCurrency(point.spend)}`}
                />
                <div
                  className="w-1/2 rounded-t-md bg-primary"
                  style={{ height: `${Math.round((point.profit / max) * 100)}%` }}
                  title={`${point.label} profit: ${formatCurrency(point.profit)}`}
                />
              </div>
              <span className="text-[0.6875rem] text-muted-foreground">{point.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NextCampaignCard({ nextCampaign }: { nextCampaign: OverviewData["nextCampaign"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>What to run next</CardTitle>
        <p className="text-sm text-muted-foreground">
          Data-picked from live Shopify signals — here&apos;s the call.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ReasonChip reason={nextCampaign.reason} />
            <ChannelBadge channel={nextCampaign.channel} />
            <span className="text-xs text-muted-foreground">{nextCampaign.objective}</span>
          </div>
          <p className="mt-3 font-heading text-lg tracking-wide">{nextCampaign.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{nextCampaign.reasonDetail}</p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Projected spend{" "}
            <span className="text-foreground tabular-nums">{nextCampaign.projectedSpend}</span>
          </p>
        </div>
        <Link
          href={nextCampaign.href}
          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Rocket className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Review it in Spend Gates</p>
            <p className="text-xs text-muted-foreground">
              Approve, hold, or deny — nothing spends until you sign off.
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: OverviewData["activity"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.map((item) => {
          const Icon = ACTIVITY_ICON[item.kind];
          return (
            <div key={item.id} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function OverviewTab({
  data,
  behaviour,
}: {
  data: OverviewData;
  /** Clarity source behaviour (backend SPEC-219); the card hides itself when absent. */
  behaviour?: ClarityCampaigns;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="size-3" aria-hidden />
          Media buyer on duty
        </Badge>
        <span className="text-xs text-muted-foreground">
          Every dollar is capped, gated, and accounted for — here&apos;s where spend
          stands today.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {data.kpis.map((kpi) => (
          <KpiTile
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            deltaKind={kpi.deltaKind}
            hint={kpi.hint}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <BlendedTrendCard trend={data.blendedTrend} />
          <div className="flex items-start gap-2 rounded-card border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <BarChart3 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ROAS is measured on real margin (COGS), not platform-reported revenue,
            and attributed against your actual Shopify orders.
          </div>
        </div>
        <div className="space-y-4">
          <NextCampaignCard nextCampaign={data.nextCampaign} />
          <ActivityCard activity={data.activity} />
        </div>
      </div>
      {behaviour && <SourceBehaviourCard data={behaviour} />}
    </div>
  );
}
