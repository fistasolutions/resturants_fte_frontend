import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, Send, ThumbsUp, TrendingUp, Wand2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityKind, OverviewData, PipelineStatus } from "@/types/social";
import { formatTime } from "@/utils/format";

import { KpiTile } from "./kpi-tile";
import { ChannelBadge, ReasonChip } from "./social-pills";
import type { IconComponent } from "@/components/shared/glisp-icon";

const STATUS_META: Record<
  PipelineStatus,
  { label: string; bar: string; badge: string }
> = {
  complete: { label: "Complete", bar: "bg-success", badge: "bg-success/10 text-success" },
  in_progress: {
    label: "In progress",
    bar: "bg-primary",
    badge: "bg-secondary text-secondary-foreground",
  },
  not_started: {
    label: "Not started",
    bar: "bg-muted-foreground/30",
    badge: "border border-border text-muted-foreground",
  },
};

const ACTIVITY_ICON: Record<ActivityKind, IconComponent> = {
  plan: ClipboardList,
  create: Wand2,
  approval: ThumbsUp,
  publish: Send,
  measure: TrendingUp,
};

function PipelineCard({ pipeline }: { pipeline: OverviewData["pipeline"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Content pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Plan → Create → Approve → Publish → Measure — the loop every post runs
          through.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipeline.map((stage, i) => {
          const meta = STATUS_META[stage.status];
          return (
            <div key={stage.id} className="flex gap-3">
              <div className="flex flex-col items-center pt-0.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                {i < pipeline.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{stage.name}</p>
                  <span
                    className={cn(
                      "inline-flex h-5 items-center rounded-4xl px-2 text-[0.6875rem] font-medium",
                      meta.badge,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", meta.bar)}
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {stage.progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function NextPostCard({ nextPost }: { nextPost: OverviewData["nextPost"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>What to post next</CardTitle>
        <p className="text-sm text-muted-foreground">
          Data-picked from live Shopify signals — here&apos;s the call.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ReasonChip reason={nextPost.reason} />
            <ChannelBadge channel={nextPost.channel} />
            <span className="text-xs text-muted-foreground">{nextPost.persona}</span>
          </div>
          <p className="mt-3 font-heading text-lg tracking-wide">{nextPost.productName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{nextPost.reasonDetail}</p>
        </div>
        <Link
          href={nextPost.href}
          className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Wand2 className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Open it in Content Studio</p>
            <p className="text-xs text-muted-foreground">
              Generate creative + a caption in your brand voice.
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

export function OverviewTab({ data }: { data: OverviewData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="size-3" aria-hidden />
          Manager on duty
        </Badge>
        <span className="text-xs text-muted-foreground">
          Social Media Manager is building your presence — here&apos;s where it stands today.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {data.kpis.map((kpi) => (
          <KpiTile
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            hint={kpi.hint}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PipelineCard pipeline={data.pipeline} />
        <div className="space-y-4">
          <NextPostCard nextPost={data.nextPost} />
          <ActivityCard activity={data.activity} />
        </div>
      </div>
    </div>
  );
}
