import Link from "next/link";
import { ArrowRight, Target, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRoas, roasTone, type RoasTone } from "@/lib/ads";
import type { Campaign, CampaignsData, NextCampaign } from "@/types/ads";
import { formatCurrency } from "@/utils/format";

import { ChannelBadge, ReasonChip, StatusPill } from "./ads-pills";
import { CreateCampaignDialog } from "./create-campaign-dialog";

const ROAS_TONE: Record<RoasTone, string> = {
  strong: "text-success",
  steady: "text-foreground",
  weak: "text-destructive",
};

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.6875rem] font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", tone ?? "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const live = campaign.spent > 0;
  const profitTone =
    campaign.profit > 0
      ? "text-success"
      : campaign.profit < 0
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="rounded-card border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelBadge channel={campaign.channel} />
            <StatusPill status={campaign.status} />
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{campaign.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{campaign.objective}</span>
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3" aria-hidden />
              {campaign.persona}
            </span>
            <span>{campaign.offer}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[0.6875rem] font-medium text-muted-foreground">
            Budget cap
          </span>
          <p className="text-sm font-medium text-foreground tabular-nums">
            {formatCurrency(campaign.dailyCap)}/day
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(campaign.totalCap)} total
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
        <Metric label="Spent" value={formatCurrency(campaign.spent)} />
        <Metric
          label="ROAS (margin)"
          value={live ? formatRoas(campaign.roas) : "—"}
          tone={live ? ROAS_TONE[roasTone(campaign.roas)] : "text-muted-foreground"}
        />
        <Metric
          label="CAC"
          value={live ? formatCurrency(campaign.cac) : "—"}
          tone={live ? undefined : "text-muted-foreground"}
        />
        <Metric
          label="Profit / revenue"
          value={
            live
              ? `${formatCurrency(campaign.profit)} / ${formatCurrency(campaign.revenue)}`
              : "—"
          }
          tone={live ? profitTone : "text-muted-foreground"}
        />
      </div>
    </div>
  );
}

function RecommendedCard({ recommended }: { recommended: NextCampaign }) {
  return (
    <Card className="gap-4 border-success/30 bg-success/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <Target className="size-4" aria-hidden />
          </span>
          <CardTitle>Recommended next campaign</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ReasonChip reason={recommended.reason} />
          <ChannelBadge channel={recommended.channel} />
          <span className="text-xs text-muted-foreground">{recommended.objective}</span>
        </div>
        <p className="font-heading text-lg tracking-wide">{recommended.name}</p>
        <p className="text-sm text-muted-foreground">{recommended.reasonDetail}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs font-medium text-muted-foreground">
            Projected spend{" "}
            <span className="text-foreground tabular-nums">{recommended.projectedSpend}</span>
          </p>
          <Link
            href={recommended.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Send to Spend Gates
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function CampaignsTab({ data }: { data: CampaignsData }) {
  return (
    <div className="space-y-6">
      <RecommendedCard recommended={data.recommended} />

      <Card className="gap-4">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Media plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                {data.campaigns.length === 0
                  ? "No campaigns yet. Create one — it starts as a draft and spends nothing until you approve it."
                  : `${data.campaigns.length} campaign(s), each with its own budget cap and profit-aware performance.`}
              </p>
            </div>
            <CreateCampaignDialog />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
