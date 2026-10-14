import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Send, ThumbsUp, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityKind, OverviewData, PipelineStatus } from "@/types/spotlight";
import { formatTime } from "@/utils/format";

import { KpiTile } from "./kpi-tile";
import { GlispIcon, type IconComponent } from "@/components/shared/glisp-icon";

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
  research: GlispIcon,
  draft: FileText,
  publish: Send,
  approval: ThumbsUp,
  measure: TrendingUp,
};

function PipelineCard({ pipeline }: { pipeline: OverviewData["pipeline"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Visibility pipeline</CardTitle>
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

function ActivityCard({ activity }: { activity: OverviewData["activity"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No activity yet. Generate your first draft to get started.
          </p>
        )}
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

function NextActionsCard({ actions }: { actions: OverviewData["nextActions"] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Next best actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up — nothing needs your attention right now.
          </p>
        )}
        {actions.map((action) => {
          const body = (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.detail}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
                {action.cta}
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
            </div>
          );
          return action.href ? (
            <Link key={action.id} href={action.href} className="block">
              {body}
            </Link>
          ) : (
            <div key={action.id}>{body}</div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ data }: { data: OverviewData }) {
  // Honest header chip: only claim "Foundations ready" once the Foundation
  // stage is actually complete (backend brand_dna_ready) — never fabricated.
  const foundationReady =
    data.pipeline.find((stage) => stage.id === "foundation")?.status ===
    "complete";
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="size-3" aria-hidden />
          {foundationReady ? "Foundations ready" : "Setting up foundations"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Search Visibility is building visibility — here&apos;s where it stands today.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
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
          <ActivityCard activity={data.activity} />
          <NextActionsCard actions={data.nextActions} />
        </div>
      </div>
    </div>
  );
}
